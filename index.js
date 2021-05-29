const fetch = require('node-fetch')
const formurlencoded = require('form-urlencoded')
const sha512 = require('crypto-js/sha512')
const WebSocket = require('ws')

module.exports = class DeStreamAPI {
  constructor(config) {
    this._clientId = config.clientId
    this._clientSecret = config.clientSecret
    this.apiVersion = config.apiVersion ?? 2

    this.baseURI = `https://destream.net/api/v${this.apiVersion}`
  }

  static UserExistsException(api_response) {
    this.apiResponse = api_response
  }

  static AccessTokenIncorrect(api_response) {
    this.apiResponse = api_response
  }

  _getSignature() {
    return sha512(this._clientId+getISO8601Date()+this._clientSecret)
  }

  async getTokensFromCode(authorizationCode, redirectUri) {
    const accessTokenEndpoint = `${this.baseURI}/oauth2/token`
    let params = formurlencoded({
      grant_type: 'authorization_code',
      client_id: this._clientId,
      client_secret: this._clientSecret,
      redirect_uri: redirectUri,
      code: authorizationCode
    })
    let response = await fetch(`${accessTokenEndpoint}?${params}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    let parsedAPIResponse = await response.json()
    return { ...parsedAPIResponse, http_status: response.status }
  }

  async refreshAccessToken(scope, refresh_token) {
    const tokenRefreshingEndpoint = `${this.baseURI}/oauth2/token`
    let params = formurlencoded({
      grant_type: 'refresh_token',
      client_id: this._clientId,
      client_secret: this._clientSecret,
      scope: scope,
      refresh_token: refresh_token
    })
    let response = await fetch(`${tokenRefreshingEndpoint}?${params}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    let parsedAPIResponse = await response.json()
    return { ...parsedAPIResponse, http_status: response.status }
  }

  async getUser(token_type, access_token) {
    const userInfoEndpoint = `${this.baseURI}/users`
    let response = await fetch(userInfoEndpoint, {
      method: 'GET',
      headers: {
        'X-Api-ClientId': this._clientId,
        'Authorization': `${token_type} ${access_token}`
      }
    })
    let parsedAPIResponse = await response.json()
    if(response.status === 401){ throw DeStreamAPI.AccessTokenIncorrect(parsedAPIResponse) }
    return { ...parsedAPIResponse, http_status: response.status }
  }

  async registerUser(email) {
    const registerUserEndpoint = `${this.baseURI}/users/register`
    let response = await fetch(registerUserEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: email
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Api-ClientId': this._clientId,
        'X-Api-RequestDate': getISO8601Date(),
        'X-Api-Signature': this._getSignature()
      }
    })

    let parsedAPIResponse = await response.json()

    const HTTP_STATUS_USER_EXISTS = 409
    if(response.status === HTTP_STATUS_USER_EXISTS){ throw new DeStreamAPI.UserExistsException(parsedAPIResponse) }

    return { ...parsedAPIResponse, http_status: response.status }
  }

  async getTips(tokens, offset, limit, sinceDate) {
    const userInfoEndpoint = `${this.baseURI}/users/tips`
    let params = formurlencoded({
      offset: offset ?? 0,
      limit: Math.max(0, Math.min(30, limit ?? 10)),
      after_date: sinceDate instanceof Date ? getISO8601Date(sinceDate) : null
    }, { ignorenull: true })
    let response = await fetch(`${userInfoEndpoint}?${params}`, {
      method: 'GET',
      headers: {
        'X-Api-ClientId': this._clientId,
        'Authorization': `${tokens.token_type} ${tokens.access_token}`
      }
    })
    let parsedAPIResponse = await response.json()
    if(response.status === 401){ throw DeStreamAPI.AccessTokenIncorrect(parsedAPIResponse) }
    if(response.status === 200){
      parsedAPIResponse.next = () => this.getTips(offset+limit, limit, sinceDate)
      parsedAPIResponse.prev = () => this.getTips(Math.max(0, offset-limit), limit, sinceDate)
    }
    return { ...parsedAPIResponse, http_status: response.status }
  }

  async getInvoicesPayments(tokens, offset, limit, sinceDate, arrayOfIds) {
    const userInfoEndpoint = `${this.baseURI}/payments`
    let params = formurlencoded({
      offset: offset ?? 0,
      limit: Math.max(0, Math.min(30, limit ?? 10)),
      after_date: sinceDate instanceof Date ? getISO8601Date(sinceDate) : null,
      payment_id: arrayOfIds ? arrayOfIds.join(',') : null
    }, { ignorenull: true })
    let response = await fetch(`${userInfoEndpoint}?${params}`, {
      method: 'GET',
      headers: {
        'X-Api-ClientId': this._clientId,
        'X-Api-RequestDate': getISO8601Date(),
        'X-Api-Signature': this._getSignature(),
        'Authorization': `${tokens.token_type} ${tokens.access_token}`
      }
    })
    let parsedAPIResponse = await response.json()
    if(response.status === 401){ throw DeStreamAPI.AccessTokenIncorrect(parsedAPIResponse) }
    if(response.status === 200){
      parsedAPIResponse.next = () => this.getInvoicesPayments(offset+limit, limit, sinceDate)
      parsedAPIResponse.prev = () => this.getInvoicesPayments(Math.max(0, offset-limit), limit, sinceDate)
    }
    return { ...parsedAPIResponse, http_status: response.status }
  }

  subscribeToEvents(access_token, callback) {
    const websocketEndpoint = `${this.baseURI}/donations`
    let params = formurlencoded({
      client_id: this._clientId,
      access_token: access_token
    })
    const ws = new WebSocket(`${websocketEndpoint}?${params}`)
    ws.on('message', callback)
  }

  async createInvoice(user_id, amount, currency, message, success_url, fail_url, additional_data) {
    const registerUserEndpoint = `${this.baseURI}/payments`
    let response = await fetch(registerUserEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        user_id: user_id,
        amount: amount,
        currency: currency,
        ...(message && {message: message})
        ...(success_url && {success_url: success_url})
        ...(fail_url && {fail_url: fail_url})
        ...(additional_data && {additional_data: additional_data})
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Api-ClientId': this._clientId,
        'X-Api-RequestDate': getISO8601Date(),
        'X-Api-Signature': this._getSignature()
      }
    })
    let parsedAPIResponse = await response.json()
    return { ...parsedAPIResponse, http_status: response.status }
  }

  validateSignature(body, receivedSignature) {
    return sha512(body+this._clientSecret) === receivedSignature
  }
}

const getISO8601Date = (date) => {
  const o0 = s => (`0${s}`).substr(-2)

  let date = date ?? new Date()

  let year = date.getFullYear()
  let month = o0(date.getMonth()+1)
  let day = o0(date.getDate())

  let hours = o0(date.getHours())
  let minutes = o0(date.getMinutes())
  let seconds = o0(date.getSeconds())

  let tzOffset = -date.getTimezoneOffset();
  let dif = tzOffset >= 0 ? '+' : '-';
  let tzH = o0(tzOffset / 60)
  let tzM = o0(tzOffset % 60)

  // ISO8601 date + time + timezone example: 2021-05-28T20:34:37+00:00
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${dif}${tzH}:${tzM}`
}