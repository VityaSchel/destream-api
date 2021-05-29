const DeStreamAPI = require('destream-api')

let destream = new DeStreamAPI({clientId: '12345', clientSecret: 'secret-secret'})

// Пользователи, пункт 1: Отправка 301 – обработчик для получения кода – вызов метода получения токена.
/* Неясная формулировка */



// Пользователи, пункт 2: Веб-сокет, серверный метод обновления токена при 401 ответе
/* Нереализуемо на NodeJS. Вместо этого я рекомендую сделать протокол ws и закрывать соединение с ошибкой 1401 */



// Пользователи, пункт 3: Получение профиля, обновление токена в случае 401 ответа, вывод информации на экран.
async function getUserProfile() {
  let token_type = 'access_token',
      access_token = 'ULsNbzcNdyCLgZnVkHCrgy03',
      refresh_token = 'GpCBnXcDorIdXbQfshZme0DU',
      user = undefined;
  /* Устанавливаем токены, полученные вручную ранее. Объявляем переменные с помощью let,
     чтобы можно было их обновить автоматически. Также объявляем переменную user, чтобы
     обозначить ей необходимую область видимости.

     Declaring variables with tokens, which we got before. Declaring with let keyword,
     so we can update them later automatically. Also declating user variable so it can
     have extended scope. */

  const retreive = async () => {
    /*  Объявляем отдельную асинхронную функцию, чтобы вызвать API с обновленными
        токенами, в случае их истечения.

        Declaring an asynchronious function inside main function, so we can call it
        with updated tokens in case they are expired. */

    try {
      user = await destream.getUser(token_type, access_token)
      /* Получаем информацию о пользователе из API с токенами

         Retrieving user profile information with API tokens */
    } catch (DeStreamAPI.AccessTokenIncorrect) {
      { token_type, access_token, refresh_token } = await destream.refreshToken('profile', refresh_token)
      await retreive()
      /* getUser генерирует исключение типа DeStreamAPI.AccessTokenIncorrect если API
         возвращает 401 http-код (access_token истек). Поэтому мы обновляем его refresh_token'ом

         getUser throws an DeStreamAPI.AccessTokenIncorrect exception in case if API
         returns 401 http status (access_token is expired). So we update it with refresh token */
    }
  }
  await retreive()

  user = user.data
  console.log(`Пользователь ${user.nickname} с ${user.email_confirmed?'':'не'}подтвержденным почтовым адресом ${user.email} имеет ID ${user.user_id}`)
}

getUserProfile()



// Пользователи, пункт 4: Получение платежей; постранично по 10 на страницу
async function getInvoicesPerPage(page) {
  const limit = 10;
  /* Лимит может быть от 0 до 30, согласно документации DeStream API

     The limit can be anything between 0 and 30, according to DeStream API docs */

  let invoices = await destream.getInvoicesPayments(
    { token_type: 'access_token', access_token: 'k51k57XqkD2CuTQs62B0Mvjd' },
    (page-1)*limit,
    limit
  )
  /* Первый аргумент — это токены, второй — смещение (на 1 странице смещение будет 0,
     на 2 странице уже будет равно лимиту), третий — лимит платежей на страницу

     First argument is object with tokens, second is offset (on the 1st page offset
     will be 0, on the 2nd it will be limit), third is limit invoices per page */

  console.log(invoices)
}

getInvoicesPerPage(1)



// Пользователи, пункт 4: Получение платежей; после даты
async function getInvoicesAfterDate(dateObject) {
  let invoices = await destream.getInvoicesPayments(
    { token_type: 'access_token', access_token: 'k51k57XqkD2CuTQs62B0Mvjd' },
    0, 20,
    dateObject)
  /* Первый аргумент — это токены, второй — смещение, третий — лимит платежей на страницу,
     четвертый — объект даты JavaScript, после которой нужно вывести платежи

     First argument is object with tokens, second is offset, third is limit invoices per page,
     fourth is a JavaScript Date object, after which API returns invoices */

  console.log(dateObject)
}

let weekEarlier = new Date().setDate(new Date().getDate() - 7)
getInvoicesAfterDate(weekEarlier)