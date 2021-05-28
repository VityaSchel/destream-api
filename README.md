# DeStream-API — Full featured DeStream API NodeJS wrapper

destream-api currently supports:

- authentification (getting access tokens, refreshing them)
- user info retreiving
- registering user with email
- getting latest donations with pagination support (.next(), .prev() functions on result), limit, offset, date-filtering
- creating invoices (filled donation forms) and getting information about latest invoices
- subscribing to events on websocket server such as new donations

## Installation

```shell
$ npm i destream-api
```

or with yarn

```shell
$ yarn add destream-api
```

## Usage

```javascript
const DeStreamAPI = require('destream-api')

let destream = new DeStreamAPI({clientId: '12345', clientSecret: 'secret-secret-secret'})

async function registerMe() {
  let response = await destream.registerUser('vityaschel@utidteam.com')
  console.log(response)
} registerMe()
```

## API Reference

[DeStream API Documentation (ru)](https://destream.net/resourcefiles/downloads/destream_api_ru.pdf)

## Token & authentification

#### async getTokensFromCode(authorizationCode, redirectUri)

Exchanges authorization code from oauth to access token, refresh token, token type.

Example usage:

```javascript
let { access_token, refresh_token, token_type } = await destream.getTokensFromCode('lk12j3a1p', 'https://destream.ru/')
```

#### async refreshAccessToken(scope, refresh_token)

Refreshes access token so it won't expire.

Example usage:

```javascript
let { access_token, refresh_token, token_type } = await destream.refreshAccessToken('profile+tips', '2QwlfWHU7OYs')
```

### Users

#### async getUser(token_type, access_token)

Gets user which gave your app access to its account.

Example usage:

```javascript
let { data } = await destream.getUser('token_type', '3jjprwOCd1Gi')
console.log(data.nickname, data.email)
```

#### async getTokensFromCode(authorizationCode, redirectUri)

Exchanges authorization code from oauth to access token, refresh token, token type.

Example usage:

```javascript
let { access_token, refresh_token, token_type } = await destream.getTokensFromCode('lk12j3a1p', 'https://destream.ru/')
```

#### async registerUser(email)

Register new user on destream with specified email.

Example usage:

```javascript
let newUser = await destream.registerUser('help@gmail.com')
if(newUser.status === 409) { throw 'User exists!' }
console.log('User created!', newUser.data.user_id)
```

### Tips + polling & websocket server

#### async getTips(tokens, offset, limit, sinceDate)

Gets latest tips. Tokens is an object: { token_type: 'string', access_token: 'string' }; Everything else is optional: offset and limit are Numbers; sinceDate is Date object

Example usage:

```javascript
let { data, total } = await destream.getTips({'token_type', '3jjprwOCd1Gi'})
console.log('You have', total, 'tips with total amount sum of', data.reduce((prev, cur) => prev+cur.amount, 0), '!')
```

#### async subscribeToEvents(access_token, callback)

Subscribes you to websocket server which sends you messages such as donationReceived. Callback function is called every time with exactly 1 argument: message text.

Example usage:

```javascript
destream.subscribeToEvents('lk12j3a1p', message => {
  console.log('WOO HOOO! DONATE!!!', message.sender, 'I LOVE YOU SO MUCH thanks for', message.amount, message.currency)
})
```

### Invoices (kinda)

I call it invoices because it is literally invoice: user is redirected directly to pay page. No forms needed to be filled by user.

#### async createInvoice(user_id, amount, currency, message, success_url, fail_url, additional_data)

Creates an invoice with specified parameters. All optional but 3: user id, amount and currency. additional_data must be a string.

Example usage:

```javascript
let invoice = await destream.createInvoice(81923, 100, 'RUB')
console.log('Invoice with', invoice.data.payment_id, 'created. Now please go to', invoice.data.payment_url)
```

#### async getInvoicesPayments(tokens, offset, limit, sinceDate, arrayOfIds)

Gets information about created invoices. Tokens is an object: { token_type: 'string', access_token: 'string' }; Everything else is optional: offset and limit are Numbers; sinceDate is Date object; arrayOfIds must be an array of numbers (payment_ids)

Example usage:

```javascript
let tenCreatedInvoices = await destream.getInvoicesPayments({'token_type', '3jjprwOCd1Gi'})
console.log('You created these invoices: ', ...tenCreatedInvoices.data.map(invoice => invoice.payment_id))
```