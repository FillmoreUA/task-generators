(function () {
  const App = (window.App = window.App || {});
  App.wordsets = {
    UA: {
      themes: [
        {
          name: "Тварини",
          words: ["кіт", "собака", "кінь", "корова", "вовк", "заєць", "лисиця", "ведмідь", "мишка", "жаба"]
        },
        {
          name: "Їжа",
          words: ["хліб", "молоко", "яблуко", "груша", "каша", "сир", "м'ясо", "риба", "сік", "торт"]
        },
        {
          name: "Природа",
          words: ["сонце", "небо", "дерево", "квітка", "трава", "річка", "ліс", "гора", "море", "вітер"]
        },
        {
          name: "Школа",
          words: ["школа", "книга", "зошит", "ручка", "олівець", "парта", "дошка", "урок", "клас", "друг"]
        }
      ]
    },
    PL: {
      themes: [
        {
          name: "Zwierzęta",
          words: ["kot", "pies", "koń", "krowa", "wilk", "zając", "lis", "mysz", "żaba", "ptak"]
        },
        {
          name: "Jedzenie",
          words: ["chleb", "mleko", "jabłko", "gruszka", "kasza", "ser", "mięso", "ryba", "sok", "tort"]
        },
        {
          name: "Przyroda",
          words: ["słońce", "niebo", "drzewo", "kwiat", "trawa", "rzeka", "las", "góra", "morze", "wiatr"]
        }
      ]
    },
    EN: {
      themes: [
        {
          name: "Animals",
          words: ["cat", "dog", "horse", "cow", "wolf", "hare", "fox", "mouse", "frog", "bird"]
        },
        {
          name: "Food",
          words: ["bread", "milk", "apple", "pear", "porridge", "cheese", "meat", "fish", "juice", "cake"]
        },
        {
          name: "Nature",
          words: ["sun", "sky", "tree", "flower", "grass", "river", "forest", "mountain", "sea", "wind"]
        }
      ]
    }
  };
})();
