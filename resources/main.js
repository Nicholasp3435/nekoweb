console.log('Loaded', document.currentScript.src);

/** adds favicons for each anchor with the class .include-icon */
function add_icons() {
    const anchors = document.querySelectorAll('a.include-icon');

    anchors.forEach(anchor => {
        anchor.innerHTML = `${anchor.textContent}<img class="favicon" src="https://icons.duckduckgo.com/ip3/${anchor.host}.ico" aria-hidden="true" alt="">`;
        if (anchor.host === 'x.com') {
            anchor.innerHTML = `${anchor.textContent}<img class="favicon" src="/resources/imgs/twitter.png" aria-hidden="true" alt="">`;
        }
    });
}

/** handler for toggle crt effect button on side */
function toggle_crt() {
    if (getComputedStyle(document.querySelector('html')).getPropertyValue('--flicker-content') == "''") {
        document.querySelector('html').style.setProperty('--flicker-content', '#0000');
        localStorage.setItem('crt-on', 'false');
    } else {
        document.querySelector('html').style.setProperty('--flicker-content', '');
        localStorage.setItem('crt-on', 'true');
    }
}

/** sets the crt effect based on local storage  */
function check_crt() {
    if (localStorage.getItem('crt-on') === null) {
        localStorage.setItem('crt-on', 'true');
    } else if (localStorage.getItem('crt-on') === 'false') {
        document.querySelector('html').style.setProperty('--flicker-content', '#0000');
    }
}


/** generates the entire sidebar */
function generate_side() {
    const date =  document.lastModified.substring(0, 10).split('/');

    const yyyy = date[2];
    const mm = date[0];
    const dd = date[1];

    // create the side bar
    const side = document.createElement('section');
    side.setAttribute('id', 'side');

    side.innerHTML = 
    `<a href="#main" id="skip-to-content">Skip to content</a>
    <h2>sidebar stuffs</h2>
    <hr>
    <h3>site navigation</h3>
    <nav>
        <ul>
            <li><a href="/">home</a></li>
            <li><a href="/coding_projects/">coding projects</a>
                <ul>
                    <li><a href="/coding_projects/3d_rendering/">3D rendering</a></li>
                </ul>
            </li>
            <li>photo gallery
                <ul>
                    <li><a href="/photo_gallery/earth/">earth</a></li>
                    <li><a href="/photo_gallery/space/">space</a></li>
                </ul>
            </li>
            <li><a href="/todo/">todo</a></li>
            <li><a href="/credits/">credits</a></li>
        </ul>
    </nav>
    <hr>
    <h3>Current solar and lunar phase</h3>
    <div id='sun-moon-phase'>
            <img src="https://www.spaceweatherlive.com/images/SDO/latest_512_0193.jpg" id="sol"> 
    </div>
    <hr>
    <h3>last updated:</h3>
    <p>${yyyy}-${mm}-${dd}</p>
    <p>
        <a href="https://validator.w3.org/nu/?doc=https%3A%2F%2Fnichao.neocities.org%2F" target="_blank" rel="noopener noreferrer">
            <!-- svg source from https://github.com/bradleytaunt/html5-valid-badge -->
            <img src="/resources/imgs/html5-validator-badge.svg" alt="Valid HTML 5 Page" height="31" width="88">
        </a>
    </p>
    <hr>
    <button onclick="toggle_crt()" id="toggle-crt">Toggle<br>CRT effect</button>`;

    // disallow traversal to the current page
    side.querySelectorAll('a').forEach(anchor => {
        if (anchor.href === window.location.href) {
            anchor.removeAttribute('href');
            anchor.classList.add('current');
        }
    });

    get_sun_moon(side);

    const content = document.querySelector('#content')

    content.insertBefore(side, content.querySelector('main'));
}

/**  sets the images of the sun and moon for the side */
function get_sun_moon(side) {
    const sun_moon_div = side.querySelector('#sun-moon-phase');

    sun_moon_div.querySelector('#sol').alt = `An image of the sun, as it would appear ${new Date().toString()}.`

    const moonImg = document.createElement("img");
    sun_moon_div.appendChild(moonImg);

    const dial_a_moon_url = "https://svs.gsfc.nasa.gov/api/dialamoon/";

    var r = new XMLHttpRequest();

    r.onload = function () {
        const json = JSON.parse(r.responseText);
        var moonURL = json['image']['url'];
        moonImg.src = moonURL;
        moonImg.id = "lun";
        moonImg.alt = json['image']['alt_text'];
    };

    r.open("GET", dial_a_moon_url);
    r.send(); 
}


// modified from https://codepen.io/zachkrall/pen/MWWGMPx
function updateText() {

    const delay = 100;

    const styles = ["rainbow", "trans", "wavy-t", "wavy-l", "wavy-s"];

    // Finds all fancy text
    let text_elements = document.getElementsByClassName("fancy");

    for (let i = 0; i < text_elements.length; i++) {
        let element = text_elements[i];

        // Splits each letter inside it into an individual span
        formatted = element.innerText
        .split("")
        .map(letter => {
            return `<span>` + letter + `</span>`;
        })
        .join("");

        element.innerHTML = formatted;

        // parses the current styles to apply
        let element_styles = [];

        for (let j = 0; j < styles.length; j++) {
            let style = styles[j];
            if (element.classList.contains(style)) {
                element_styles.push(style);
                element.classList.remove(style);
            }
        }

        // applies each of the styles to each letter with a slight delay
        Array.from(element.children).forEach((span, index) => {
            setTimeout(() => {
                for (let j = 0; j < element_styles.length; j++) {
                    let style = element_styles[j];
                    span.classList.add(style);

                    if (style !== "mouse-bouncy") {
                        // combines animations
                        span.style.animationName = element_styles.join(', ');
                    }
                }
            }, index * 60 + delay);
        });
    }
}

// lag from other things loading can cause things to look incorrect
document.body.onload = () => updateText();


add_icons();
generate_side();
check_crt();