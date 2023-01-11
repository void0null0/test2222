const axios = require("axios");

class ContentApi {
    private axios;
    constructor() {
        this.axios = axios.create({
            baseURL: 'https://valorant-api.com/v1'
        })
    }

    public async getAgents() {
        return (await this.axios.get('/agents?isPlayableCharacter=true')).data.data;
    }
}

const api = new ContentApi();

(async () => {
    let agents = await api.getAgents();
    console.log(agents)
})();