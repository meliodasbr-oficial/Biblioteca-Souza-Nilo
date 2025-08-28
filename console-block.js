(function() {
    let autorizado = false;
    window.desbloquearConsole = function(s) {
      if (s === senha) {
        autorizado = true;
        alert("✅ Console desbloqueado! Você é autorizado.");
        // Restaura DOM
        document.body.style.visibility = "visible";
      } else {
        alert("❌ Senha incorreta!");
      }
    };
    const bloquearTudo = () => {
      if (autorizado) return;
      console.clear();
      document.body.style.visibility = "hidden";

      const conteudo = document.getElementById("conteudo");
      if (conteudo) conteudo.innerHTML = "";
      document.body.innerHTML = "<h1>🚫 Acesso Negado 🚫</h1>";
    };

    const detectConsole = () => {
      if (autorizado) return;
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() { bloquearTudo(); }
      });
      console.log(element);
    };

    setInterval(detectConsole, 1000);

    document.addEventListener('keydown', function(e) {
      if (autorizado) return;
      if (
        e.key === "F12" || 
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) || 
        (e.ctrlKey && e.key === "U")
      ) {
        bloquearTudo();
        e.preventDefault();
        return false;
      }
    });

  })();