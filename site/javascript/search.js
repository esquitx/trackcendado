// Function to format a Date object to 'YYYY-MM-DD'
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get the current date
const currentDate = new Date();
const currentDay = formatDate(currentDate);

// Get yesterday's date
const yesterdayDate = new Date();
yesterdayDate.setDate(currentDate.getDate() - 1);
const yesterdayDay = formatDate(yesterdayDate);



document.addEventListener('DOMContentLoaded', function() {

  const searchInput = document.getElementById('search-input');
  const contentDiv = document.getElementById('content');
  const isProductPage = window.location.pathname.includes('product.html');
  const initialContent = contentDiv.innerHTML;

  if (!searchInput || !contentDiv) {
    console.error('One or more elements not found:', {
      searchInput,
      contentDiv
    });
    return;
  }

function displayProducts(products, container, pricing) {
    container.classList.add('vertical-layout');
    container.classList.remove('horizontal-layout');
    container.innerHTML = '';
    const header = document.createElement('div');
    header.classList.add('search-header');
    header.innerHTML = `
      <div class="header-product">
        <span class="header-img"></span>
        <span class="header-name">Producto</span>
      </div>
      <span class="header-category">Categoría</span>
      <span class="header-price">Precio</span>
    `;
    container.appendChild(header);

    if (products.length === 0) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.classList.add('no-results');
        noResultsMessage.textContent = 'No se han encontrado productos para esa búsqueda';
        container.appendChild(noResultsMessage);
        return;
    }

    const ul = document.createElement('ul');
    ul.classList.add('search-results');
    ul.id = 'search-results'

    products.forEach(product => {

    

        const priceData = pricing[product.category_name][product.id]["prices"] || {};

        const dateKeys = Object.keys(priceData).sort((a, b) => new Date(b) - new Date(a));

        const todayDate = dateKeys[0];
        const yesterdayDate = dateKeys.length > 1 ? dateKeys[1] : null;



        const todayPrice = priceData[todayDate].price;
        const yesterdayPrice = yesterdayDate ? priceData[yesterdayDate].price : 0;
        const priceChangeClass = todayPrice >= yesterdayPrice ? 'price-up' : 'price-down';

        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <a href="product.html?id=${product.id}" class="product-link">
            <div class="product-info">
              <img src="${product.image_url}" alt="${product.name}">
              <span class="product-name">${product.name}</span>
            </div>
            <span class="product-category">${product.category_name}</span>
            <span class="product-price ${priceChangeClass}">${todayPrice}€</span>
          </a>
        `;
        ul.appendChild(listItem);
    });
  container.appendChild(ul);
  // Select the scrollable container and the elements to apply the effect on
  var queryList = document.querySelector('.search-results');
  var elements = queryList.querySelectorAll('.search-results li');

function applyOpacityEffect() {
  var containerHeight = queryList.clientHeight;
  var scrollTop = queryList.scrollTop;
  
  elements.forEach(function(element) {
    var elementOffsetTop = element.offsetTop;
    var elementHeight = element.offsetHeight;

    // Check if the element is 100px below the top of the scrollable container
    if (elementOffsetTop > (scrollTop + 10*elementHeight)) {
      console.log(1 - ((elementOffsetTop + elementHeight) / (containerHeight)))

      var opacity = Math.max(1 - (scrollTop + elementOffsetTop  / containerHeight)); // Set minimum opacity to 0.2 for a softer effect
      element.style.transition = 'opacity 0.3s'
      element.style.opacity = opacity;
    } else {
      element.style.opacity = 1;
    }
  });
}

// Apply the effect when the window is loaded
document.addEventListener('load', applyOpacityEffect);
// Apply the effect when the container is scrolled
queryList.addEventListener('scroll', applyOpacityEffect);
}

  function filterProducts(query, products, categories) {
    return Object.values(products).filter(product => 
      product.name.toLowerCase().includes(query) || 
      (product.category && categories[product.category].name.toLowerCase().includes(query))
    );
  }

  fetch('../scraper/data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {

      const products = data.products;
      const categories = data.categories;
      const pricing = data.pricing;

      searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        if (query) {
          const filteredProducts = filterProducts(query, products, categories).slice(0, 10);
          displayProducts(filteredProducts, contentDiv, pricing);


        } else {
          window.location.reload();
          }
        }
      );
    })
    .catch(error => {
      console.error('Error fetching products:', error);
    });

});
