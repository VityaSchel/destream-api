const DeStreamAPI = require('destream-api')
const express = require('express')
const app = express()

let destream = new DeStreamAPI({clientId: '12345', clientSecret: 'secret-secret'})

// Платежи, пункт 1: Связывание пользователя – получение профиля и сохранение user_id – обработка оповещения о подтверждении e-mail
async function startEmailConfirmationWebhookServer() {
  let user = await destream.getUser({ token_type: 'access_token', access_token: '' })
  let savedUserID = user.user_id
  /* Получаем user_id пользователя, используя объект с токенами

     Retrieving user_id using tokens object */

  app.use(express.json())
  /* Используем JSON-парсер сервера express

     We'll use JSON body-parser of express server */

  app.post('/UserDataChangedCallbackUrl', (req, res) => {
    if(destream.validateSignature(JSON.stringify(req.body), req.headers['X-Signature'])){
      /* Проверка на соответствие подписи в заголовках

         Check if X-Signature is valid */

      res.send('OK')
      if(req.body.user_id === savedUserID && req.body.data.email_confirmed === true){
        /* Проверка на соответствие user id и измененное поле

           Check if user id equals saved user id and email confirmed */

        console.log('User has confirmed its email!')
      }
    }
  })
  app.listen(3000, () => {
    console.log(`Listening for user data notifications at http://localhost:${port}`)
  })
  /* Сервер Express работает на порте 3000, но вам потребуется настроить обратный прокси,
     чтобы ваш основной веб-сервер смог принимать запрссы

     Express server is running at 3000 port, but you have to set up reverse proxy
     in order to start receiving http notifications */
}

startEmailConfirmationWebhookServer()



// Платежи, пункт 1: Связывание пользователя – создание пользователя – получение токена – чтение профиля и сохранение user_id
async function getUserIDofCreatedUser(email) {
  let registeredUser = await destream.registerUser(email)
  /* Регистрируем пользователя и выводим о нем информацию в консоль

     Registering user and logging its info in console */
  console.log('Токен юзера', registeredUser.data.user_token)
  console.log('User_ID', registeredUser.data.user_id)
}

getUserIDofCreatedUser('vityaschel@utidteam.com')



// Платежи, пункт 2: Отправка платежа пользователю
async function sendInvoiceForCake() {
  const cakePrice = 50,
        receiverUserID = 12589172;
  /* Объявляем константы с необходимыми для выставления счета значениями

     Declaring constants with values needed for creating invoice */
  let paymentURI = await destream.createInvoice(receiverUserID, cakePrice, 'RUB')
  console.log(paymentURI)
}

sendInvoiceForCake()



// Платежи, пункт 3: Обработка уведомления об изменении статуса платежа
async function startInvoiceStateWebhookServer() {
  app.use(express.json())
  /* Используем JSON-парсер сервера express

     We'll use JSON body-parser of express server */

  app.post('/PaymentCallbackUrl', (req, res) => {
    if(destream.validateSignature(JSON.stringify(req.body), req.headers['X-Signature'])){
      /* Проверка на соответствие подписи в заголовках

         Check if X-Signature is valid */

      res.send('OK')
      console.log({
        -1: 'Транзакция отклонена / DECLINED',
        1: 'Транзакция в обработке / PROCESSING',
        2: 'Транзакция успешно выполнена / COMPLETED'
      }[req.body.data.transaction_status_code])
      /* Выводим в консоль статус транзакции

         Logging to console transaction status */
    }
  })
  app.listen(3001, () => {
    console.log(`Listening for payments notifications at http://localhost:${port}`)
  })
  /* Сервер Express работает на порте 3001, но вам потребуется настроить обратный прокси,
     чтобы ваш основной веб-сервер смог принимать запрссы

     Express server is running at 3001 port, but you have to set up reverse proxy
     in order to start receiving http notifications  */
}

startInvoiceStateWebhookServer()



// Платежи, пункт 4: Получение списка платежей – с фильтром по пользователям
async function getTipsFromUser(username) {
  let tipsArray = []
  let tips = await destream.getTips({ tokenType: 'access_token', access_token: 'se1XiLKX8E7R4H3NBwa66aSf' })
  while(tips.next){
    let tips = await tips.next()
    /* Получаем список всех донатов за все время, чтобы затем отфильтровать по донатеру

       Getting all tips so we can then filter only ones from specified user */
       
    tipsArray.push(...tips.data.filter(tip => tip.username === username))
    /* Записываем в tipsArray только донаты от юзера с конкретным именем. Будьте
       осторожны: знак равенства === сравнивает и регистр!

       Pushing only tips from user with specified username. Be aware that this
       search is case sensetive! */
  }
  console.log(tipsArray)
}

getTipsFromUser('VityaSchel')