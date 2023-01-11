const { create } = require("axios");
const { Agent } = require("https");

interface credentials {
    username: string;
    password: string;
}

class Authenticator {
    private readonly agent;
    private readonly httpClient;

    constructor() {
        this.agent = new Agent({
            ciphers: [
                "TLS_CHACHA20_POLY1305_SHA256",
                "TLS_AES_128_GCM_SHA256",
                "TLS_AES_256_GCM_SHA384",
                "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256"
            ].join(":"),
            honorCipherOrder: true,
            minVersion: "TLSv1.2"
        });
        this.httpClient = create({
            headers: { "User-Agent": "RiotClient/60.0.10.4802528.4749685 rso-auth (Windows;10;;Professional, x64)" },
            httpsAgent: this.agent
        });
    }

    private async getCookie() {
        let res = await this.httpClient.post("https://auth.riotgames.com/api/v1/authorization", {
            "client_id": "play-valorant-web-prod",
            "nonce": "1",
            "redirect_uri": "https://playvalorant.com/opt_in",
            "response_type": "token id_token",
            "scope": "account openid"
        });
        return res.headers["set-cookie"]
    }

    // public async authorize(username:string, password:string) { }

    public async getAccessToken(account: credentials) {
        let _res = await this.httpClient.put("https://auth.riotgames.com/api/v1/authorization", {
                "type": "auth",
                "username": account.username,
                "password": account.password,
                "remember": true
            },
            {
                headers: { "Cookie": await this.getCookie() }
            }
        );
        let res = _res.data;

        return new Promise((resolve, reject) => {
            switch (res.type) {
                case "auth":
                case "error": {
                    reject(res);
                    break
                }

                case "response": {
                    let url = new URL(res.response.parameters.uri);
                    let params = new URLSearchParams(url.hash.substring(1));

                    resolve({
                        "type": "response",
                        "cookies": _res.headers["set-cookie"],
                        "accessToken": params.get("access_token"),
                        "idToken": params.get("id_token"),
                        "expiresIn" : Number(params.get("expires_in"))
                    });
                    break
                }

                case "multifactor": {
                    resolve({
                        "type": "multifactor",
                        "cookies": _res.headers["set-cookie"],
                        "email" : res.data
                    });
                    break
                }
            }
        });
    }

    public async fetchEntitlementsToken(accessToken: string) {
        let res = await this.httpClient.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return res.data["entitlements_token"]
    }

    public async fetchUserInfo(accessToken: string) {
        let res = await this.httpClient.post('https://auth.riotgames.com/userinfo', {}, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        return res.data
    }

    public async fetchRegion(accessToken:string, idToken:string) {
        let res = await this.httpClient.put('https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant',
            { 'id_token' : idToken },
            { headers: {'Authorization': `Bearer ${accessToken}`} }
        );
        return res.data.affinities.live
    }
}

const valAuth = new Authenticator();
(async () => {
    let auth = await valAuth.getAccessToken({
        username: "ReQueHD",
        password: "Savaboykiller1"
    });

    // @ts-ignore
    console.log(await valAuth.fetchUserInfo(auth["accessToken"], auth["idToken"]));
})();