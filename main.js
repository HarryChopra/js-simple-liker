const articlesEl = document.querySelector('div.articles');
const errorModalEl = document.querySelector('div#modal');
const articlesURL = 'http://localhost:4000/articles';

const state = { articles: [] };

async function apiGET(url) {
    const fetchResponse = await fetch(url);
    const response = await fetchResponse.json();
    if (fetchResponse.ok && fetchResponse.status === 200) return response;
    let err = new Error();
    throw {
        ...err,
        ...{
            message: fetchResponse.statusText || 'failed to get data',
            status: fetchResponse.status || ''
        }
    };
}

async function apiPOST(url, method, data) {
    const fetchResponse = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(data)
    });
    const response = await fetchResponse.json();
    // if (fetchResponse.ok) return response;
    if (fetchResponse.ok) return response;
    let err = new Error();
    throw {
        ...err,
        ...{
            message: fetchResponse.statusText || 'failed to send data',
            status: fetchResponse.status || ''
        }
    };
}

async function likeArticle(e) {
    const elID = parseInt(e.target.parentNode.id);
    const articleIdx = state.articles.findIndex(a => a.id === elID);
    const article = { ...state.articles[articleIdx] };
    article.like = !article.like;
    try {
        // introduce a fake server error at random
        if (Math.random() < 0.2) {
            throw { ...new Error(), msg: 'fake server error' };
        }
        const updatedArticle = await apiPOST(`${articlesURL}/${article.id}`, 'PATCH', article);
        state.articles[articleIdx] = updatedArticle;
        const updatedArticleEl = createArticleEl(updatedArticle);
        document.querySelector(`article[id="${article.id}"]`).replaceWith(updatedArticleEl);
    } catch (err) {
        // if a fake server error, show an error modal
        if (err.msg) {
            toggleErrorModal(err.msg);
            return;
        }
        console.debug('error updating like:', err);
    }
}

function toggleErrorModal(err) {
    errorModalEl.lastChild.textContent = err;
    errorModalEl.className = '';
    setTimeout(() => {
        errorModalEl.className = 'hidden';
    }, 3000);
}

function createArticleEl(article) {
    const el = document.createElement('article');
    el.id = article.id;
    el.className = 'media-post';
    el.innerHTML = `
    <header><h2>${article.author} says:</h2></header>
    <p>${article.description}</p>
    <footer>
    <ul><li id=${article.id} class="like">
    Like! ${article.like ? '<span class="like-glyph activated-heart">♥' : '<span class="like-glyph">♡'}</span>
    </li></ul>
    </footer>`;
    el.querySelector('span.like-glyph').addEventListener('click', likeArticle);
    return el;
}

function renderArticles(articles) {
    articles.forEach(article => articlesEl.appendChild(createArticleEl(article)));
}

async function loadArticles() {
    try {
        state.articles = await apiGET(articlesURL);
        renderArticles(state.articles);
    } catch (err) {
        console.debug('error getting articles', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});
