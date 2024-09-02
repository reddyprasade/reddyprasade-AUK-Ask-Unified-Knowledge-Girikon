const cron = require("node-cron");
const axios = require('axios');

const midnight_call = (cron_time = '0 0 * * *') => {
    cron.schedule(cron_time, async () => {
        console.log('running a task every midnight');
        // const url = process.env.HOST + "/api/v1/subscription/expire";
        // const res = await axios.get(url);
        // console.log(res.data);
    });
};

module.exports = {
    midnight_call
};