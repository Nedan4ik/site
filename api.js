/**
 * Файл со всем апишками и прослушивателями
 *
 * Используемые библиотеки:
 * express -> обработчик запросов
 */

const express = require('express');
const fs = require("node:fs");
const crypto = require('crypto');
const {MessageBuilder} = require("./MessageBuilder");
const path = require("node:path");
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());
const port = 8000;

const sid = process.env.SID;
const auth = process.env.AUTH;

const twilio = require('twilio')(sid, auth);
global.twilio = twilio;

const algorithm = 'aes-256-cbc';
const secretKey = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const iv = Buffer.from('fixed16bytes1232', 'utf-8');

/**
 * Все зарегестрированные аккаунты
 *
 * Находятся в форме:
 *  AuthToken: STRING
 *  first_name: STRING
 *  last_name: STRING
 *  phone_number: STRING
 *  password: ENCRYPTED STRING
 */

// Дефолтный экземпляр для юзера
const user = {
    AuthToken: "Some string",
    first_name: "Name",
    last_name: "Last Name",
    password: encrypt('1234567890'),
    phone_number: "+71234567890"
}

let registeredAccounts = [];
const activeToAuth = [];

const read = readAccounts();

if (read)
    console.log('Успешно прочитал содержимое всех юзеров!');

/**
 * Прослушиватель для авторизации
 * Принимает login_params в котором должно быть:
 *  first_name -> Имя пользователя
 *  last_name -> Фамилия пользователя
 *  password -> Энксприченый пароль
 *
 *  Возвращает юзера
 */

app.post('/login', (req, res) => {
    try {
        if (!req.body || !req.body.login_params) {
            return res.status(400).json({status: 'error', message: 'Необходим Body для входа в систему!'});
        }

        const {first_name, last_name, password} = req.body.login_params;

        if (!first_name || !last_name || !password) {
            return res.status(400).json({status: 'error', message: 'Не достаточно параметров'});
        }

        const user = registeredAccounts.find(user => compare(user, {
            first_name: first_name,
            last_name: last_name,
            password: password
        }));

        if (user) {
            return res.status(200).json({status: 'OK', message: 'Найден', user});
        }

        return res.status(404).json({status: 'error', message: 'Пользователь не найден'});
    } catch (e) {
        console.error('Ошибка при попытке входа: ', e);
        res.status(500).json({
            status: 'error',
            message: 'Произошла ошибка на сервере. Попробуйте позже.'
        });
    }
});

app.post('/register', (req, res) => {
    try {
        if (!req.body || !req.body.register_params) {
            return res.status(400).json({status: 'error', message: 'Необходим Body для регистрации в системе!'});
        }

        const { first_name, last_name, password, phone_number } = req.body.register_params;

        if (!first_name || !last_name || !password || !phone_number) {
            return res.status(400).json({status: 'error', message: 'Не достаточно параметров'});
        }

        if (!phoneValidator(phone_number)) {
            return res.status(400).json({status: 'error', message: 'Неверный формат номера телефона'});
        }

        const authToken = generateAuthToken();

        const user = {
            AuthToken: authToken,
            first_name: first_name,
            last_name: last_name,
            password: encrypt(password),
            phone_number: phone_number,
        }

        activeToAuth.push(user);

        const redirectUrl = `/verify-phone?authToken=${authToken}`;

        const code = generateConfirmationCode();

        user.confirmationCode = code;

        new MessageBuilder()
            .setFromPhone('+12184177477')
            .setToPhone(user.phone_number)
            .setMessage(`Ваш код подтверждения: ${code}`)
            .create();

        res.status(200).json({
            status: 'OK',
            message: 'Пользователь успешно зарегестрирован, перейдите по ссылке чтобы подтвердить номер телефона',
            redirect_url: redirectUrl
        });
    } catch (e) {
        console.error('Ошибка при попытке регистрации:', e);
        res.status(500).json({
            status: 'error',
            message: 'Произошла ошибка на сервере. Попробуйте позже.'
        });
    }
});

app.post('/enc', (req, res) => {
    const body = req.body;

    if (body) {
        res.json({ enc: encrypt(body.text) });
    }
});

app.get('/register', (req, res) => {
    const authToken = 'e014bd242fc65478c3fae1394e640df6f8d847a6f02d61f0fd47d7e729adb16d';

    const redirectUrl = `/verify-phone?authToken=${authToken})}`;
    res.redirect(redirectUrl);
});

app.post('/getGallery', (req, res) => {
    fs.readdir('./gallery/', (err, files) => {
        if (err) {
            return res.status(500).send('Ошибка при чтении папки');
        }

        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

        const images = imageFiles.map(file => {
            const filePath = path.join('./gallery/', file);
            const imageData = fs.readFileSync(filePath);
            return {
                name: file,
                data: Buffer.from(imageData).toString('base64'),
            };
        });

        res.json(images);
    });
});

app.get('/verify-phone', (req, res) => {
/*
    const query = req.query;

    if (!query || !query.authToken)
        return res.status(400).send('Предоставьте AuthToken');

    const user = activeToAuth.find(user => user.AuthToken === query.authToken);

    if (!user)
        return res.status(404).send('Пользователь не найден!');

    const html = `
        <html lang="EN_us">
            <body>
                <h1>Подтверждение телефона</h1>
                <p>Телефон: ${user.phone_number}</p>
                <p>Пожалуйста, введите код, который вам был отправлен на номер телефона.</p>
                <form>
                    <label for="verification-code">Код подтверждения:</label>
                    <input type="text" id="verification-code" name="verification-code" required>
                    <button type="submit">Подтвердить</button>
                </form>
            </body>
        </html>
    `;
*/

    res.send(fs.readFileSync('./pages/verifyPhone.html', 'utf-8'));
});

/**
 * Начинаем прослушивать все запросы на порту
 */

app.listen(port, () => {
    console.log(`Прослушиваем на порту: ${port}`);
});

/**
 * Дефолтные утилиты:
 * Функции рида и сейва всех юзеров
 * Проверка на юзеров
 * Энкрипт и декрипт
 * Сравнения юзеров
 * Генерация AuthToken для пользователей
 * Валидация телефонного номера
 */

function readAccounts() {
    if (!fs.existsSync('./accounts.json')) return false;

    const file = fs.readFileSync('./accounts.json', 'utf8');

    try {
        registeredAccounts = JSON.parse(file);
        return true;
    } catch (error) {
        console.error('Ошибка при парсинге JSON:', error);
        return false;
    }
}

function saveAccounts() {
    const text = JSON.stringify(registeredAccounts, null, 2);
    try {
        fs.writeFileSync('./accounts.json', text, 'utf8');
        console.log('Accounts saved successfully!');
    } catch (err) {
        console.error('Error saving accounts:', err);
    }
}

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function generateAuthToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateConfirmationCode() {
    return crypto.randomInt(100000, 1000000);
}

function compare(user1, user2) {
    const isEqual = user1.first_name === user2.first_name &&
        user1.last_name === user2.last_name;

    console.log(decrypt(user1.password))
    console.log(decrypt(user2.password))

    const isPasswordEqual = decrypt(user1.password) === decrypt(user2.password);

    return isEqual && isPasswordEqual;
}

const phoneValidator = (phoneNumber) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
};

process.on('exit', () => {
    saveAccounts();
});

process.on('SIGINT', () => {
    saveAccounts();
    process.exit();
});