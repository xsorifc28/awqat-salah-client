import axios from 'axios';
import { ApiError, AwqatSalahApi } from '../src';

jest.spyOn(global, 'setTimeout');
jest.mock('axios');
jest.useFakeTimers();

const mockedAxios = axios as jest.Mocked<typeof axios>;
const consoleInfo = jest.spyOn(console, 'info').mockImplementation();
const consoleError = jest.spyOn(console, 'error').mockImplementation();

describe('AwqatSalahApi', () => {

  const header = {
    'alg': 'HS256',
    'typ': 'JWT'
  }

  const data = {
    'https://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'uuid',
    'https://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'test@test',
    'https://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Developer',
    exp: Date.now() / 1000 + 65,
    iss: 'test.com',
    aud: 'test.com'
  }

  const mockedAccessToken = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(data));
  const mockRefreshToken = 'mockRefreshToken';

  describe('Init, Auth and RefreshToken', () => {
    let api: AwqatSalahApi;

    beforeEach(() => {
      api = new AwqatSalahApi();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should initialize with default base URL', () => {
      expect(api['baseUrl']).toBe('https://awqatsalah.diyanet.gov.tr');
    });

    it('should initialize with a custom base URL', () => {
      const customBaseUrl = 'https://custom-url.com';
      const customApi = new AwqatSalahApi(customBaseUrl);
      expect(customApi['baseUrl']).toBe(customBaseUrl);
    });

    it('should successfully login and refresh token', async () => {

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: mockedAccessToken,
            refreshToken: mockRefreshToken,
          },
        },
      });

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: mockedAccessToken,
            refreshToken: 'newRefreshToken',
          },
        }
      });

      await api.login('test@example.com', 'password');

      expect(api['accessToken']).toBe(mockedAccessToken);
      expect(api['refreshToken']).toBe(mockRefreshToken);

      jest.runAllTimers();

      // Wait for promises triggered by setTimeout() to resolve
      await new Promise(jest.requireActual("timers").setImmediate);

      expect(api['refreshToken']).toBe('newRefreshToken');

      expect(consoleInfo).toHaveBeenCalledTimes(3);
      expect(consoleInfo).toHaveBeenNthCalledWith(1, expect.stringMatching(/^Access token will be refreshed in \d{4} millis$/));
      expect(consoleInfo).toHaveBeenNthCalledWith(2, expect.stringMatching('Refreshing access token'));
      expect(consoleInfo).toHaveBeenNthCalledWith(3, expect.stringMatching(/^Access token will be refreshed in \d{1} millis$/));
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenNthCalledWith(1, 'https://awqatsalah.diyanet.gov.tr/Auth/Login',
        {
          email: 'test@example.com',
          password: 'password'
        }
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, 'https://awqatsalah.diyanet.gov.tr/Auth/RefreshToken/mockRefreshToken', {
        headers: {
          Authorization: `Bearer ${mockedAccessToken}`
        }
      });
    });

    it('should handle login failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Login failed'));

      await expect(api.login('test@example.com', 'wrongpassword')).resolves.toBe(undefined);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenNthCalledWith(1, 'https://awqatsalah.diyanet.gov.tr/Auth/Login',
        {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      );
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenNthCalledWith(1, 'Error during API call, url: unknown, method: unknown, status: 0, axiosErrorMessage: Login failed, apiSuccess: false, apiErrorMessage: Unknown error');
    });
  });

  describe('Endpoints', () => {

    const api: AwqatSalahApi = new AwqatSalahApi();

    beforeAll(async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: mockedAccessToken,
            refreshToken: mockRefreshToken,
          },
        },
      });
      await api.login('', '');
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    const expectGetCall = <T>(response: T | undefined, mockResponseData: {
      data?: T | undefined
    }, endpoint: string) => {
      expect(response).toEqual(mockResponseData.data);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, 'https://awqatsalah.diyanet.gov.tr/api' + endpoint, {
        headers: {
          Authorization: `Bearer ${mockedAccessToken}`,
        },
      });
    };

    const expectPostCall = <T, R>(response: T | undefined, mockResponseData: {
      data?: T | undefined
    }, postBody: R, endpoint: string) => {
      expect(response).toEqual(mockResponseData.data);
      expect(mockedAxios.post).toHaveBeenNthCalledWith(1, 'https://awqatsalah.diyanet.gov.tr/api' + endpoint, postBody, {
        headers: {
          Authorization: `Bearer ${mockedAccessToken}`,
        }
      });
    }

    it('should make a GET request to fetch daily content', async () => {
      const mockResponseData = {
        success: true,
        data: {
          id: 0,
          dayOfYear: 1,
          verse: 'abc',
          verseSource: 'def',
          hadith: 'ghi',
          hadithSource: 'jkl',
          pray: 'mno',
          praySource: 'pqr'
        }
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.dailyContent();
      expectGetCall(response, mockResponseData, '/DailyContent')
    });

    it('should make a GET request to fetch countries', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            id: 1,
            name: 'Country',
            code: 'Country'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.countries();

      expectGetCall(response, mockResponseData, '/Place/Countries')
    });

    it('should make a GET request to fetch states', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            id: 1,
            name: 'State',
            code: 'State'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.states();

      expectGetCall(response, mockResponseData, '/Place/States')
    });

    it('should make a GET request to fetch states by country', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            id: 1,
            name: 'State',
            code: 'State'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.statesByCountry(1);

      expectGetCall(response, mockResponseData, '/Place/States/1')
    });

    it('should make a GET request to fetch cities', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            id: 1,
            name: 'City',
            code: 'City'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.cities();

      expectGetCall(response, mockResponseData, '/Place/Cities')
    });

    it('should make a GET request to fetch cities by state', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            id: 1,
            name: 'State',
            code: 'State'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.citiesByState(1);

      expectGetCall(response, mockResponseData, '/Place/Cities/1')
    });

    it('should make a GET request to fetch city detail', async () => {
      const mockResponseData = {
        success: true,
        data: {
          id: '1',
          name: 'City',
          code: 'City',
          geographicQiblaAngle: '1',
          distanceToKaaba: '1',
          qiblaAngle: '1',
          city: 'City',
          cityEn: 'City',
          country: 'Country',
          countryEn: 'Country'
        }
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.cityDetail(1);

      expectGetCall(response, mockResponseData, '/Place/CityDetail/1')
    });

    it('should make a GET request to fetch daily prayer times', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            shapeMoonUrl: 'url',
            fajr: 'fajr',
            sunrise: 'sunrise',
            dhuhr: 'dhuhr',
            asr: 'asr',
            maghrib: 'maghrib',
            isha: 'isha',
            astronomicalSunset: 'astSunset',
            astronomicalSunrise: 'astSunrise',
            hijriDateShort: 'hijriShort',
            hijriDateShortIso8601: 'hijriIso',
            hijriDateLong: 'hijriLong',
            hijriDateLongIso8601: 'hijriLongIso',
            qiblaTime: 'qibla',
            gregorianDateShort: 'gregShort',
            gregorianDateShortIso8601: 'gregIso',
            gregorianDateLong: 'gregLong',
            gregorianDateLongIso8601: 'gregLongIso',
            greenwichMeanTimeZone: 0,
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.dailyPrayerTime(1);
      expectGetCall(response, mockResponseData, '/PrayerTime/Daily/1');
    });

    it('should make a GET request to fetch weekly prayer times', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            shapeMoonUrl: 'url',
            fajr: 'fajr',
            sunrise: 'sunrise',
            dhuhr: 'dhuhr',
            asr: 'asr',
            maghrib: 'maghrib',
            isha: 'isha',
            astronomicalSunset: 'astSunset',
            astronomicalSunrise: 'astSunrise',
            hijriDateShort: 'hijriShort',
            hijriDateShortIso8601: 'hijriIso',
            hijriDateLong: 'hijriLong',
            hijriDateLongIso8601: 'hijriLongIso',
            qiblaTime: 'qibla',
            gregorianDateShort: 'gregShort',
            gregorianDateShortIso8601: 'gregIso',
            gregorianDateLong: 'gregLong',
            gregorianDateLongIso8601: 'gregLongIso',
            greenwichMeanTimeZone: 0,
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.weeklyPrayerTime(1);
      expectGetCall(response, mockResponseData, '/PrayerTime/Weekly/1');
    });

    it('should make a GET request to fetch monthly prayer times', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            shapeMoonUrl: 'url',
            fajr: 'fajr',
            sunrise: 'sunrise',
            dhuhr: 'dhuhr',
            asr: 'asr',
            maghrib: 'maghrib',
            isha: 'isha',
            astronomicalSunset: 'astSunset',
            astronomicalSunrise: 'astSunrise',
            hijriDateShort: 'hijriShort',
            hijriDateShortIso8601: 'hijriIso',
            hijriDateLong: 'hijriLong',
            hijriDateLongIso8601: 'hijriLongIso',
            qiblaTime: 'qibla',
            gregorianDateShort: 'gregShort',
            gregorianDateShortIso8601: 'gregIso',
            gregorianDateLong: 'gregLong',
            gregorianDateLongIso8601: 'gregLongIso',
            greenwichMeanTimeZone: 0,
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.monthlyPrayerTime(1);
      expectGetCall(response, mockResponseData, '/PrayerTime/Monthly/1');
    });

    it('should make a POST request to fetch prayer times for date range', async () => {
      mockedAxios.post.mockReset();

      const mockResponseData = {
        success: true,
        data: [
          {
            shapeMoonUrl: 'url',
            fajr: 'fajr',
            sunrise: 'sunrise',
            dhuhr: 'dhuhr',
            asr: 'asr',
            maghrib: 'maghrib',
            isha: 'isha',
            astronomicalSunset: 'astSunset',
            astronomicalSunrise: 'astSunrise',
            hijriDateShort: 'hijriShort',
            hijriDateShortIso8601: 'hijriIso',
            hijriDateLong: 'hijriLong',
            hijriDateLongIso8601: 'hijriLongIso',
            qiblaTime: 'qibla',
            gregorianDateShort: 'gregShort',
            gregorianDateShortIso8601: 'gregIso',
            gregorianDateLong: 'gregLong',
            gregorianDateLongIso8601: 'gregLongIso',
            greenwichMeanTimeZone: 0,
          }
        ]
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const dateRangeRequestBody = {
        cityId: 1,
        startDate: new Date(2022, 0, 1),
        endDate: new Date( 2023, 0, 1)
      };

      const response = await api.dateRange(dateRangeRequestBody.cityId, dateRangeRequestBody.startDate, dateRangeRequestBody.endDate);
      expectPostCall(response, mockResponseData, { cityId: 1, startDate: dateRangeRequestBody.startDate.toISOString(), endDate: dateRangeRequestBody.endDate.toISOString() }, '/PrayerTime/DateRange/');
    });


    it('should make a GET request to fetch ramadan prayer times', async () => {
      const mockResponseData = {
        success: true,
        data: [
          {
            shapeMoonUrl: 'url',
            fajr: 'fajr',
            sunrise: 'sunrise',
            dhuhr: 'dhuhr',
            asr: 'asr',
            maghrib: 'maghrib',
            isha: 'isha',
            astronomicalSunset: 'astSunset',
            astronomicalSunrise: 'astSunrise',
            hijriDateShort: 'hijriShort',
            hijriDateShortIso8601: 'hijriIso',
            hijriDateLong: 'hijriLong',
            hijriDateLongIso8601: 'hijriLongIso',
            qiblaTime: 'qibla',
            gregorianDateShort: 'gregShort',
            gregorianDateShortIso8601: 'gregIso',
            gregorianDateLong: 'gregLong',
            gregorianDateLongIso8601: 'gregLongIso',
            greenwichMeanTimeZone: 0,
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.ramadanPrayerTime(1);
      expectGetCall(response, mockResponseData, '/PrayerTime/Ramadan/1');
    });

    it('should make a GET request to fetch eid prayer times', async () => {
      const mockResponseData = {
        success: true,
        data:
          {
            eidAlAdhaHijri: 'eidAlAdhaHijri',
            eidAlAdhaTime: 'eidAlAdhaTime',
            eidAlAdhaDate: 'eidAlAdhaDate',
            eidAlFitrHijri: 'eidAlFitrHijri',
            eidAlFitrTime: 'eidAlFitrTime',
            eidAlFitrDate: 'eidAlFitrDate',
          }
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockResponseData,
      });

      const response = await api.eidPrayerTime(1);
      expectGetCall(response, mockResponseData, '/PrayerTime/Eid/1');
    });

    it('should make a GET request and gracefully return undefined on a 404', async () => {
      const mockResponseData: ApiError = {
        success: false,
        message: 'CityDetail for city id -1 not found',
      };

      mockedAxios.get.mockRejectedValue({
        message: '404 Not Found Error',
        response: {
          status: 404,
          config: {
            url: 'https://test.url',
            method: 'GET',
          },
          data: mockResponseData,
        }
      });

      const response = await api.cityDetail(-1);
      expectGetCall(response, mockResponseData, '/Place/CityDetail/-1');
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenNthCalledWith(1, 'Error during API call, url: https://test.url, method: GET, status: 404, axiosErrorMessage: 404 Not Found Error, apiSuccess: false, apiErrorMessage: CityDetail for city id -1 not found');
    });
  });
});
