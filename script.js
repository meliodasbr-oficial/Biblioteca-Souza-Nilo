const inputPesquisa = document.getElementById("pesquisa");

document.getElementById("btn-login").addEventListener("click", function() {
  window.location.href = "login.html";
});
inputPesquisa.addEventListener("input", function () {
  const termo = this.value.toLowerCase();

  const generos = document.querySelectorAll(".genero");

  generos.forEach(genero => {
    let temCorrespondencia = false;
    const tituloGenero = genero.querySelector(".titulo-genero");
    const livros = genero.querySelectorAll(".livro-card");

    livros.forEach(livro => {
      const titulo = livro.querySelector("h3").textContent.toLowerCase();

      if (titulo.includes(termo)) {
        livro.style.display = "block";
        temCorrespondencia = true;
      } else {
        livro.style.display = "none";
      }
    });

    // Oculta o título do gênero se nenhum livro corresponder
    if (termo && !temCorrespondencia) {
      tituloGenero.style.display = "none";
    } else if (termo && temCorrespondencia) {
      tituloGenero.style.display = "block";
    } else {
      tituloGenero.style.display = "block";
      livros.forEach(livro => livro.style.display = "block");
    }
  });
});
