console.log('Loaded', document.currentScript.src);

const RSS_URL = "rss.xml";

fetch(RSS_URL)
  .then(response => response.text())
  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
  .then(data => {
    let items = data.children[0].children[0].querySelectorAll('item');
    items.forEach(item => {
        document.querySelector('#item-container').append(parse_item(item))
    })
  })

function parse_item(item) {
    const item_div = document.createElement('div');

    const item_html = `
        <div class="post-box" id='${item.querySelector('guid').textContent}'>
            <div class='post-box-inner'>
                <span class="post-top-dot"></span>
                <span class="post-author">nichao</span>
                <span class="post-dot">·</span>
                <span class="post-date">${parse_date(item.querySelector('pubDate').textContent)}</span>

                <h3 class="post-title">${item.querySelector('title').textContent}</h3>

                <p class="post-description">${item.querySelector('description').textContent}</p>
                <span class="post-bottom-dot"></span>
            </div>
        </div>
    `

    item_div.innerHTML = item_html;

    if (item.querySelector('style')) {
        const styles = item.querySelector('style').innerHTML;

        styles.split('}').forEach(style => {
            let split_style = style.replace(/[\n\r\t]/gm, "").split('{');
            if (split_style.length == 2) {
                console.log(split_style[0])
                item_div.querySelectorAll(split_style[0]).forEach(elm => {
                    elm.setAttribute('style',split_style[1])
                })
            } 
        });
    }

    
    return item_div;
}

function parse_date(in_date) {
    const month_lookup = {
        "Jan": "01",
        "Feb": "02",
        "Mar": "03",
        "Apr": "04",
        "May": "05",
        "Jun": "06",
        "Jul": "07",
        "Aug": "08",
        "Sep": "09",
        "Oct": "10",
        "Nov": "11",
        "Dec": "12"
    }
    const data = in_date.split(',')[1].split(' ');
    return `${data[3]}-${month_lookup[data[2]]}-${data[1]}`;
}
