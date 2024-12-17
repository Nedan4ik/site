export function generateHeader(current) {
    const elements = [
        {name: 'Главная', href: ''},
        {name: 'Новости', href: ''},
        {name: 'Галерея', href: ''},
        {name: 'История', href: ''},
        {name: 'Аккаунт', href: ''},
    ];

    const divElement = document.querySelector('.header');

    for (const element of elements) {
        const a = document.createElement('a');
        a.textContent = element.name;
        a.style.textDecoration = 'none';
        a.style.color = current === element.name ? '#A9A9A9' : 'white';

        divElement.appendChild(a);

        if (element.name === 'Новости') {
            const icon = document.createElement('img');
            icon.src = 'icons/main-icon.png';
            icon.alt = 'Main Icon';
            divElement.appendChild(icon);
        }
    }
}

export function generateFooter() {
    const text = 'СОЮЗ ДЕСАНТНИКОВ Г.КАРАГАНДА АКТУАЛЬНАЯ ИНФОРМАЦИЯ О ЖИЗНИ КАРАГАНДИНСКОГО ОТДЕЛЕНИЯ ДШВ РК © МУТАГАРОВ И.С., 2024. ВСЕ ПРАВА ЗАЩИЩЕНЫ. ПЕРЕПЕЧАТКА И ЦИТИРОВАНИЕ МАТЕРИАЛОВ ЗАПРЕЩЕНЫ. ПО ВСЕМ ВОПРОСАМ ПИШИТЕ НА TEAM@TILDA.RU';

    const elements = [
        {icon: 'whatsapp.png', href: '#'},
        {icon: 'instagram.png', href: '#'},
        {icon: 'telegram.png', href: '#'},
        {icon: 'youtube.png', href: '#'}
    ];

    const footer = document.querySelector('footer');

    const iconsContainer = document.createElement('div');
    iconsContainer.classList.add('icons-container');

    elements.forEach(element => {
        const a = document.createElement('a');
        a.href = element.href;

        const img = document.createElement('img');
        img.src = './icons/footer/' + element.icon;
        img.alt = 'icon';
        img.classList.add('footer-icon');

        a.appendChild(img);
        iconsContainer.appendChild(a);
    });

    const footerText = document.createElement('p');
    footerText.textContent = text;

    footer.appendChild(iconsContainer);
    footer.appendChild(footerText);
}

export function generateNews() {
    const news = [
        {
            title: 'В московских клубах прошли рейды силовиков из-за "пропаганды ЛГБТ"',
            href: '/news/raid-moscow-clubs'
        },
        {
            title: 'Польша ввела "особые меры" по выдаче гуманитарных виз гражданам Беларуси',
            href: '/news/poland-special-measures'
        },
        {
            title: 'В Сирии антиправительственные группировки вошли в Алеппо',
            href: '/news/syria-aleppo'
        },
        {
            title: 'Представитель парламента Грузии: МВД начало проверку после избиения журналистов на митинге',
            href: '/news/georgia-parliament-check'
        },
        {
            title: 'В Тбилиси задержали более 100 человек во время второй акции протеста против ЕС',
            href: '/news/tbilisi-protest-arrests'
        },
        {
            title: 'Зеленский заявил, что для прекращения "горячей фазы" войны нужно "взять под зонт" НАТО',
            href: '/news/zelensky-nato-protection'
        },
    ];

    const newsElement = document.querySelector('.latest__news .news__copies');

    for (const new1 of news) {
        const div = document.createElement('div');
        div.classList.add('news__item');
        const a = document.createElement('a');

        a.textContent = new1.title;
        a.href = new1.href;
        div.appendChild(a);
        newsElement.appendChild(div);
    }
}

export async function genGallery() {
    await fetch('http://localhost:8000/getGallery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(res => {
            console.log(res);
            for (const data of res) {
                const bytes = data.data;

                const base64ToBlob = (base64) => {
                    const byteCharacters = atob(base64); // Декодируем Base64 в бинарную строку
                    const byteArrays = [];

                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteArrays.push(byteCharacters.charCodeAt(i));
                    }

                    return new Blob([new Uint8Array(byteArrays)], {type: 'image/png'});
                };

                const blob = base64ToBlob(bytes);
                const url = URL.createObjectURL(blob);
                const img = document.createElement('img');
                console.log(img);
                img.src = url;
                document.body.appendChild(img);
                console.log('added');
            }
        })
}