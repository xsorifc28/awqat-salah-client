import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export class AwqatSalahApi {
  private static readonly MILLIS_1_MINUTES: number = 60 * 1000;

  private static readonly AUTH_BASE = '/Auth';
  private static readonly API_BASE = '/api';
  private static readonly PLACE_ENDPOINT = AwqatSalahApi.API_BASE + '/Place';

  private readonly baseUrl: string = 'https://awqatsalah.diyanet.gov.tr';

  private accessToken = '';
  private refreshToken = '';

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  public async login(email: string, password: string) {
    const response: AxiosResponse<IResult<AuthResponse>, PostDataLogin> = await axios.post(this.baseUrl + `${AwqatSalahApi.AUTH_BASE}/Login`, {
      email,
      password,
    }).catch(this.handleError<AuthResponse, PostDataLogin>)

    if (this.checkSuccess<AuthResponse>(response) && response.data.data) {
      this.accessToken = response.data.data.accessToken;
      this.refreshToken = response.data.data.refreshToken;
      this.queueRefresh();
    }
  }

  private async refreshAccessToken() {
    console.info('Refreshing access token');
    const response = await this.get<AuthResponse>(`${AwqatSalahApi.AUTH_BASE}/RefreshToken/${this.refreshToken}`);

    if (response) {
      this.accessToken = response.accessToken;
      this.refreshToken = response.refreshToken;
      this.queueRefresh();
    } else {
      console.error('Failed to refresh access token');
    }
  }

  private queueRefresh(): void {
    const accessTokenExpiry = this.parseJwt(this.accessToken).exp * 1000;
    const refreshIn = Math.max(accessTokenExpiry - AwqatSalahApi.MILLIS_1_MINUTES - Date.now(), 0);
    setTimeout(() => this.refreshAccessToken(), refreshIn);
    console.info(`Access token will be refreshed in ${refreshIn} millis`);
  }

  public async dailyContent(): Promise<DailyContent | undefined> {
    return this.get<DailyContent>(`${AwqatSalahApi.API_BASE}/DailyContent`);
  }

  public async countries(): Promise<Place[] | undefined> {
    return this.get<Place[]>(`${AwqatSalahApi.PLACE_ENDPOINT}/Countries`);
  }

  public async states(): Promise<Place[] | undefined> {
    return this.get<Place[]>(`${AwqatSalahApi.PLACE_ENDPOINT}/States`);
  }

  public async statesByCountry(countryId: number): Promise<Place[] | undefined> {
    return this.get(`${AwqatSalahApi.PLACE_ENDPOINT}/States/${countryId}`);
  }

  public async cities(): Promise<Place[] | undefined> {
    return this.get<Place[]>(`${AwqatSalahApi.PLACE_ENDPOINT}/Cities`);
  }

  public async citiesByState(stateId: number): Promise<Place[] | undefined> {
    return this.get<Place[]>(`${AwqatSalahApi.PLACE_ENDPOINT}/Cities/${stateId}`);
  }

  public async cityDetail(cityId: number): Promise<CityDetail | undefined> {
    return this.get<CityDetail>(`${AwqatSalahApi.PLACE_ENDPOINT}/CityDetail/${cityId}`);
  }

  public async dailyPrayerTime(cityId: number): Promise<PrayerTime[] | undefined> {
    return this.get<PrayerTime[]>(`${AwqatSalahApi.API_BASE}/PrayerTime/Daily/${cityId}`);
  }

  public async weeklyPrayerTime(cityId: number): Promise<PrayerTime[] | undefined> {
    return this.get<PrayerTime[]>(`${AwqatSalahApi.API_BASE}/PrayerTime/Weekly/${cityId}`);
  }

  public async monthlyPrayerTime(cityId: number): Promise<PrayerTime[] | undefined> {
    return this.get<PrayerTime[]>(`${AwqatSalahApi.API_BASE}/PrayerTime/Monthly/${cityId}`);
  }

  public async eidPrayerTime(cityId: number): Promise<EidPrayerTime | undefined> {
    return this.get<EidPrayerTime>(`${AwqatSalahApi.API_BASE}/PrayerTime/Eid/${cityId}`);
  }

  public async ramadanPrayerTime(cityId: number): Promise<PrayerTime[] | undefined> {
    return this.get<PrayerTime[]>(`${AwqatSalahApi.API_BASE}/PrayerTime/Ramadan/${cityId}`);
  }

  public async dateRange(cityId: number, startDate: Date, endDate: Date): Promise<PrayerTime[] | undefined> {
    return this.post<PrayerTime[], DateRangeFilter>(`${AwqatSalahApi.API_BASE}/PrayerTime/DateRange/`, {
      cityId: cityId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  private async get<T>(path: string): Promise<T | undefined> {
    const response: AxiosResponse<IResult<T>> = await axios.get(this.baseUrl + path, this.getAuthHeaderConfig()).catch(this.handleError<T, void>);
    return this.extractResponse(response);
  }

  private async post<T, R>(path: string, data: R): Promise<T | undefined> {
    const response: AxiosResponse<IResult<T>> = await axios.post(this.baseUrl + path, data, this.getAuthHeaderConfig()).catch(this.handleError<T, void>);
    return this.extractResponse(response);
  }

  private getAuthHeaderConfig() {
    return {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    };
  }

  private extractResponse<T>(response: AxiosResponse<IResult<T>>) {
    if (this.checkSuccess<T>(response)) {
      return response.data.data;
    } else {
      return undefined;
    }
  }

  private checkSuccess<T>(response: AxiosResponse<IResult<T>>): boolean {
    return response.status >= 200
            && response.status <= 299
            && response.data.success
            && response.data.data !== undefined;
  }

  private parseJwt(token: string): JwtToken {
    return JSON.parse(atob(token.split('.')[1]));
  }

  private handleError<T, D>(e: AxiosError<IResult<T>, D>): AxiosResponse<IResult<T>, D> {
    const response = e.response || {
      data: {
        success: false,
        message: 'Unknown error'
      },
      status: 0,
      statusText: '0',
      headers: {},
      config: e.config as InternalAxiosRequestConfig<D> || {
        method: 'unknown',
        url: 'unknown'
      },
      message: e.message
    };

    console.error(`Error during API call, url: ${response.config.url}, method: ${response.config.method}, status: ${response.status}, axiosErrorMessage: ${e.message}, apiSuccess: ${response.data.success}, apiErrorMessage: ${response.data.message}`);

    return response;
  }
}

type IResult<T = never> = {
    success: boolean,
    message: string | null
    data?: T
}

type ApiError = IResult

type AuthResponse = {
    accessToken: string,
    refreshToken: string
}

type PostDataLogin = {
    email: string,
    password: string
}

type DateRangeFilter = {
    cityId: number,
    startDate: string,
    endDate: string
}

type JwtToken = {
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string,
    exp: number,
    iss: string,
    aud: string
}

type DailyContent = {
    id: number,
    dayOfYear: number,
    verse: string,
    verseSource: string,
    hadith: string,
    hadithSource: string,
    pray: string,
    praySource: string
}

type Place = {
    id: number,
    code: string,
    name: string,
}

type CityDetail = {
    id: string,
    name: string,
    code: string,
    geographicQiblaAngle: string,
    distanceToKaaba: string,
    qiblaAngle: string,
    city: string,
    cityEn: string,
    country: string,
    countryEn: string
}

type PrayerTime = {
    shapeMoonUrl: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    astronomicalSunset: string;
    astronomicalSunrise: string;
    hijriDateShort: string;
    hijriDateShortIso8601: string;
    hijriDateLong: string;
    hijriDateLongIso8601: string;
    qiblaTime: string;
    gregorianDateShort: string;
    gregorianDateShortIso8601: string;
    gregorianDateLong: string;
    gregorianDateLongIso8601: string;
    greenwichMeanTimeZone: number;
};

type EidPrayerTime = {
    eidAlAdhaHijri: string;
    eidAlAdhaTime: string;
    eidAlAdhaDate: string;
    eidAlFitrHijri: string;
    eidAlFitrTime: string;
    eidAlFitrDate: string;
};

export {
  ApiError,
  DailyContent,
  Place,
  CityDetail,
  PrayerTime,
  EidPrayerTime
}
