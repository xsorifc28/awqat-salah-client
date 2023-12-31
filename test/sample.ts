import { AwqatSalahApi } from '../src'

(async () => {
    const api = new AwqatSalahApi();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await api.login(process.env.email!, process.env.password!);

    const dailyContent = await api.dailyContent();
    console.info(`Got daily content, day of year: ${dailyContent?.dayOfYear}`);

    const countries = await api.countries();
    console.info(`Got countries: ${countries?.length}`);

    const states = await api.states();
    console.info(`Got states: ${states?.length}`);

    const cities = await api.cities();
    console.info(`Got cities: ${cities?.length}`);

    if(countries?.length) {
        const statesByCountry = await api.statesByCountry(countries[0].id);
        console.info(`Got states for country ${countries[0].name}: ${statesByCountry?.length}`);

        if(statesByCountry?.length) {
            const citiesByState = await api.citiesByState(statesByCountry[0].id);
            console.info(`Got cities for state ${statesByCountry[0].name}: ${citiesByState?.length}`);

            if(citiesByState?.length) {
                const cityId = citiesByState[0].id;

                const cityDetail = await api.cityDetail(cityId);
                console.info(`Got city details, distance to kaaba: ${cityDetail?.distanceToKaaba}`);

                const dailyPrayerTimes = await api.dailyPrayerTime(cityId);
                console.info(`Got daily prayer times: ${dailyPrayerTimes?.length}`);

                const weeklyPrayerTimes = await api.weeklyPrayerTime(cityId);
                console.info(`Got weekly prayer times: ${weeklyPrayerTimes?.length}`);

                const monthlyPrayerTimes = await api.monthlyPrayerTime(cityId);
                console.info(`Got monthly prayer times: ${monthlyPrayerTimes?.length}`);

                const dateRangeTime = await api.dateRange(cityId, new Date(2023, 0), new Date(2023, 6));
                console.info(`Got prayer times for range: ${dateRangeTime?.length}`);

                const eidPrayerTime = await api.eidPrayerTime(cityId);
                console.info(`Got eid prayer times: ${eidPrayerTime?.eidAlAdhaDate}`);

                const ramadanPrayerTime = await api.ramadanPrayerTime(cityId);
                console.info(`Got ramadan prayer times: ${ramadanPrayerTime?.length}`);
            }
        }
    }

    process.exit(0);

})();

