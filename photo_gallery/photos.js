console.log('Loaded', document.currentScript.src);

const pages = document.querySelectorAll('.collapsible');
const collapse_btns = document.querySelectorAll('.collapse-btn');

function collapse(div, btn) {
    pages.forEach(page => {
        page.classList.add('collapsed');
    });
    collapse_btns.forEach(btn => {
        btn.classList.remove('active'); 
    });

    div.classList.remove('collapsed');
    btn.classList.add('active');
}

const copy = document.createElement('div');

copy.innerHTML = 
    `
        <div>
            <h2>Copyright</h2>
            <p>All of the photographs displayed in this page are licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC-SA 4.0<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1" alt=""></a></p> 
            <img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc-sa.svg" alt="Creative Commons BY-NC-SA" id="CC">
        <div>
    `;

document.querySelector('main').append(copy);

const form = document.querySelector('form');

if (form) {
    form.addEventListener('change', (event) => {
        let inputs = event.currentTarget.elements;
        for (const input of inputs) {
            document.querySelectorAll(`[data-year="${input.id}"]`).forEach((figure) => {
                input.checked ? figure.classList.remove('hidden') : figure.classList.add('hidden');
            });
        }
    });
}

pages.forEach(page => {
    page.classList.add('collapsed');
});

pages[0].classList.remove('collapsed');


