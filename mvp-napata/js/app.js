/* NaPata (MVP demonstrativo). Site estático: dados em data/napata_dados.xml, estado no localStorage do navegador.
   Autenticação simplificada, apenas para fins acadêmicos: NÃO é segura (dados ficam no navegador). */
(function () {
  "use strict";

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function brl(v) { return "R$ " + Number(v).toFixed(2).replace(".", ","); }
  function load(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { toast("Não foi possível salvar neste navegador."); } }
  function hoje() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function fmtData(iso) { var p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; } return String(h); }
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- dados (XML) ---------- */
  var DADOS = { servicos: [], prestadores: [] };
  function parseXml(texto) {
    var doc = new DOMParser().parseFromString(texto, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("XML inválido");
    function txt(el, tag) { var n = el.getElementsByTagName(tag)[0]; return n ? n.textContent : ""; }
    var servicos = [].map.call(doc.getElementsByTagName("servico"), function (s) {
      return { id: s.getAttribute("id"), nome: txt(s, "nome"), categoria: txt(s, "categoria"), descricao: txt(s, "descricao") };
    });
    var prestadores = [].map.call(doc.getElementsByTagName("prestador"), function (p) {
      return { id: p.getAttribute("id"), nome: txt(p, "nome"), bairro: txt(p, "bairro"), cidade: txt(p, "cidade"),
        servicoRef: txt(p, "servicoRef"), preco: parseFloat(txt(p, "precoEstimado")), nota: parseFloat(txt(p, "avaliacaoDemonstrativa")),
        horario: txt(p, "horario") };
    });
    return { servicos: servicos, prestadores: prestadores };
  }
  function carregarDados() {
    return fetch("data/napata_dados.xml").then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).catch(function () { return window.NAPATA_XML; }).then(function (txt) { DADOS = parseXml(txt); });
  }
  function servico(id) { return DADOS.servicos.filter(function (s) { return s.id === id; })[0]; }
  function prestador(id) { return DADOS.prestadores.filter(function (p) { return p.id === id; })[0]; }
  var ICONES = { banho: "&#128704;", vet: "&#129658;", petshop: "&#128717;", hospedagem: "&#127976;", adestramento: "&#127934;" };

  /* ---------- estado ---------- */
  function usuario() { return load("napata_user", null); }
  function logado() { return !!load("napata_sessao", false) && !!usuario(); }
  function solicitacoes() { return load("napata_solicitacoes", []); }
  var ROTULO = { solicitado: "Solicitado", analise: "Em análise", confirmado: "Confirmado (demo)" };
  var PROXIMO = { solicitado: "analise", analise: "confirmado" };

  /* ---------- roteador ---------- */
  var view = document.getElementById("view");
  var tabbar = document.getElementById("tabbar");
  var btnVoltar = document.getElementById("btn-voltar");
  var titulo = document.getElementById("titulo-tela");
  var PUBLICAS = ["login", "sobre"];

  function rota() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var partes = h.split("/");
    var nome = partes[0] || (logado() ? "home" : "login");
    return { nome: nome, arg: partes[1], arg2: partes[2] };
  }
  function ir(h) { location.hash = h; }
  window.addEventListener("hashchange", render);
  btnVoltar.addEventListener("click", function () { history.length > 1 ? history.back() : ir("#/home"); });

  function render() {
    var r = rota();
    if (!logado() && PUBLICAS.indexOf(r.nome) === -1) { ir("#/login"); return; }
    var telas = { login: vLogin, sobre: vSobre, home: vHome, busca: vBusca, prestador: vPrestador, solicitar: vSolicitar,
      confirmacao: vConfirmacao, solicitacoes: vSolicitacoes, chatbot: vChatbot, perfil: vPerfil };
    var fn = telas[r.nome] || vHome;
    var info = fn(r) || {};
    titulo.textContent = info.titulo || "NaPata";
    btnVoltar.hidden = !info.voltar;
    tabbar.hidden = !logado();
    [].forEach.call(tabbar.querySelectorAll("a"), function (a) {
      a.classList.toggle("ativo", a.getAttribute("data-tab") === (info.tab || r.nome));
    });
    window.scrollTo(0, 0);
  }
  function set(html) { view.innerHTML = html; }

  /* ---------- telas ---------- */
  function vSobre() {
    set('<h2>Sobre este MVP</h2><div class="card"><p>O <strong>NaPata</strong> é uma proposta acadêmica de aplicativo para localizar, comparar e solicitar serviços para cães e gatos, com foco na Região Metropolitana do Rio de Janeiro.</p>' +
      '<p class="muted">Projeto da disciplina Tecnologia da Informação e Negócios (UFF).</p></div>' +
      '<div class="aviso"><strong>Atenção:</strong> todos os dados (prestadores, preços, avaliações) são fictícios. Nenhum pagamento é processado e nenhuma solicitação é enviada a prestadores reais. O login é simplificado e <strong>não é seguro</strong>: os dados ficam apenas neste navegador.</div>' +
      '<a class="btn full" href="#/' + (logado() ? "home" : "login") + '">Continuar</a>');
    return { titulo: "Sobre", voltar: logado() };
  }

  function vLogin() {
    if (logado()) { ir("#/home"); return {}; }
    var temConta = !!usuario();
    set('<div class="hero"><h2>Cuide do seu pet com quem entende</h2><p>Encontre, compare e solicite serviços para o seu melhor amigo.</p></div>' +
      '<div class="card"><div class="row" role="tablist" style="margin-bottom:8px">' +
      '<button class="btn ' + (temConta ? "" : "sec") + '" id="t-entrar" type="button" style="flex:1">Entrar</button>' +
      '<button class="btn ' + (temConta ? "sec" : "") + '" id="t-cadastrar" type="button" style="flex:1">Criar conta</button></div>' +
      '<form id="f-login" novalidate></form></div>' +
      '<p class="muted" style="text-align:center"><a href="#/sobre">Sobre este MVP e aviso de dados fictícios</a></p>');
    var modo = temConta ? "entrar" : "cadastrar";
    function desenhar() {
      var f = document.getElementById("f-login");
      document.getElementById("t-entrar").className = "btn " + (modo === "entrar" ? "" : "sec");
      document.getElementById("t-cadastrar").className = "btn " + (modo === "cadastrar" ? "" : "sec");
      f.innerHTML = (modo === "cadastrar" ? '<label for="nome">Nome</label><input id="nome" autocomplete="name" maxlength="60">' : "") +
        '<label for="email">E-mail</label><input id="email" type="email" autocomplete="email" maxlength="80">' +
        '<label for="senha">Senha</label><input id="senha" type="password" autocomplete="' + (modo === "entrar" ? "current-password" : "new-password") + '" maxlength="40">' +
        (modo === "cadastrar" ? '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400"><input id="aceite" type="checkbox" style="width:auto;margin-top:4px"> Li e concordo com o tratamento dos meus dados conforme o termo de consentimento (LGPD) deste MVP.</label>' : "") +
        '<p class="erro" id="erro" role="alert"></p><button class="btn full" type="submit">' + (modo === "entrar" ? "Entrar" : "Criar conta") + '</button>' +
        '<p class="muted" style="margin-top:10px">Autenticação simplificada para fins acadêmicos.</p>';
    }
    desenhar();
    document.getElementById("t-entrar").onclick = function () { modo = "entrar"; desenhar(); };
    document.getElementById("t-cadastrar").onclick = function () { modo = "cadastrar"; desenhar(); };
    document.getElementById("f-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim().toLowerCase();
      var senha = document.getElementById("senha").value;
      var erro = document.getElementById("erro");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { erro.textContent = "Informe um e-mail válido."; return; }
      if (senha.length < 6) { erro.textContent = "A senha precisa ter pelo menos 6 caracteres."; return; }
      if (modo === "cadastrar") {
        var nome = document.getElementById("nome").value.trim();
        if (nome.length < 2) { erro.textContent = "Informe seu nome."; return; }
        if (!document.getElementById("aceite").checked) { erro.textContent = "É preciso aceitar o termo de consentimento."; return; }
        save("napata_user", { nome: nome, email: email, senha: hash(senha), pet: null });
        save("napata_sessao", true); toast("Conta criada. Bem-vinda(o), " + nome + "!"); ir("#/home");
      } else {
        var u = usuario();
        if (!u || u.email !== email || u.senha !== hash(senha)) { erro.textContent = "E-mail ou senha incorretos (ou conta ainda não criada neste navegador)."; return; }
        save("napata_sessao", true); toast("Login realizado."); ir("#/home");
      }
    });
    return { titulo: "NaPata" };
  }

  function cardPrestador(p) {
    var s = servico(p.servicoRef);
    return '<div class="card clicavel" tabindex="0" role="link" data-id="' + esc(p.id) + '">' +
      '<div class="row between"><h3>' + esc(p.nome) + '</h3><span class="nota">&#9733; ' + p.nota.toFixed(1).replace(".", ",") + '</span></div>' +
      '<div class="muted">' + esc(s ? s.nome : "") + " &middot; " + esc(p.bairro) + ", " + esc(p.cidade) + '</div>' +
      '<div class="row between" style="margin-top:8px"><span class="tag">a partir de ' + brl(p.preco) + '</span><span class="muted">avaliação demonstrativa</span></div></div>';
  }
  function ligarCards() {
    [].forEach.call(view.querySelectorAll(".card.clicavel[data-id]"), function (c) {
      function abrir() { ir("#/prestador/" + c.getAttribute("data-id")); }
      c.addEventListener("click", abrir);
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
    });
  }

  function vHome() {
    var u = usuario();
    var cats = DADOS.servicos.map(function (s) {
      return '<div class="cat" tabindex="0" role="link" data-cat="' + esc(s.categoria) + '"><span>' + (ICONES[s.categoria] || "&#128062;") + '</span>' + esc(s.nome) + '</div>';
    }).join("");
    var top = DADOS.prestadores.slice().sort(function (a, b) { return b.nota - a.nota; }).slice(0, 3).map(cardPrestador).join("");
    set('<h2>Olá, ' + esc(u.nome.split(" ")[0]) + '! &#128075;</h2><p class="muted">O que você procura hoje?</p>' +
      '<div class="grid-cat">' + cats + '</div>' +
      '<h2 style="margin-top:20px">Mais bem avaliados (demonstrativo)</h2>' + top +
      '<div class="aviso">Dados fictícios para demonstração. <a href="#/sobre">Saiba mais</a></div>');
    [].forEach.call(view.querySelectorAll(".cat"), function (c) {
      function abrir() { ir("#/busca/" + c.getAttribute("data-cat")); }
      c.addEventListener("click", abrir);
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
    });
    ligarCards();
    return { titulo: "NaPata", tab: "home" };
  }

  function vBusca(r) {
    var cats = [{ categoria: "", nome: "Todas" }].concat(DADOS.servicos);
    var cidades = DADOS.prestadores.map(function (p) { return p.cidade; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
    set('<h2>Buscar serviços</h2><div class="card">' +
      '<label for="q">Nome ou bairro</label><input id="q" placeholder="Ex.: banho, Icaraí, vet" maxlength="40">' +
      '<label for="cat">Categoria</label><select id="cat">' + cats.map(function (c) { return '<option value="' + esc(c.categoria) + '">' + esc(c.nome) + '</option>'; }).join("") + '</select>' +
      '<label for="cid">Cidade</label><select id="cid"><option value="">Todas</option>' + cidades.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join("") + '</select>' +
      '<label for="ord">Ordenar por</label><select id="ord"><option value="nota">Melhor avaliação</option><option value="preco">Menor preço</option></select>' +
      '<p style="margin-top:10px"><button class="btn sec" id="limpar" type="button">Limpar filtros</button></p></div>' +
      '<p class="muted" id="contagem"></p><div id="lista"></div>');
    var $ = function (id) { return document.getElementById(id); };
    if (r.arg) $("cat").value = r.arg;
    function filtrar() {
      var q = $("q").value.trim().toLowerCase(), cat = $("cat").value, cid = $("cid").value, ord = $("ord").value;
      var lista = DADOS.prestadores.filter(function (p) {
        var s = servico(p.servicoRef);
        return (!cat || (s && s.categoria === cat)) && (!cid || p.cidade === cid) &&
          (!q || (p.nome + " " + p.bairro + " " + (s ? s.nome : "")).toLowerCase().indexOf(q) !== -1);
      }).sort(function (a, b) { return ord === "preco" ? a.preco - b.preco : b.nota - a.nota; });
      $("contagem").textContent = lista.length + (lista.length === 1 ? " resultado" : " resultados");
      $("lista").innerHTML = lista.length ? lista.map(cardPrestador).join("") : '<div class="card">Nenhum resultado encontrado. Tente outros filtros.</div>';
      ligarCards();
    }
    ["q", "cat", "cid", "ord"].forEach(function (id) { $(id).addEventListener("input", filtrar); });
    $("limpar").onclick = function () { $("q").value = ""; $("cat").value = ""; $("cid").value = ""; $("ord").value = "nota"; filtrar(); };
    filtrar();
    return { titulo: "Busca", tab: "busca" };
  }

  function vPrestador(r) {
    var p = prestador(r.arg);
    if (!p) { set('<div class="card">Prestador não encontrado.</div>'); return { voltar: true }; }
    var s = servico(p.servicoRef);
    set('<div class="card"><div class="row between"><h2 style="margin:0">' + esc(p.nome) + '</h2><span class="nota">&#9733; ' + p.nota.toFixed(1).replace(".", ",") + '</span></div>' +
      '<p class="muted">' + esc(s.nome) + " &middot; " + esc(p.bairro) + ", " + esc(p.cidade) + '</p>' +
      '<p>' + esc(s.descricao) + '</p><p><strong>Horário:</strong> ' + esc(p.horario) + '</p>' +
      '<p><span class="tag">a partir de ' + brl(p.preco) + '</span> <span class="muted">preço ilustrativo</span></p>' +
      '<div class="aviso">Perfil fictício. A nota é demonstrativa e não verificada.</div>' +
      '<a class="btn full" href="#/solicitar/' + esc(p.id) + '">Solicitar serviço</a></div>');
    return { titulo: "Prestador", voltar: true, tab: "busca" };
  }

  function vSolicitar(r) {
    var p = prestador(r.arg);
    if (!p) { ir("#/busca"); return {}; }
    var s = servico(p.servicoRef), u = usuario(), pet = u.pet || {};
    set('<h2>Solicitar serviço</h2><div class="card"><h3>' + esc(p.nome) + '</h3><p class="muted">' + esc(s.nome) + " &middot; " + brl(p.preco) + ' (ilustrativo)</p></div>' +
      '<form class="card" id="f-sol" novalidate>' +
      '<label for="pet">Nome do pet</label><input id="pet" maxlength="40" value="' + esc(pet.nome || "") + '">' +
      '<label for="esp">Espécie</label><select id="esp"><option>Cão</option><option>Gato</option></select>' +
      '<label for="data">Data preferida</label><input id="data" type="date" min="' + hoje() + '">' +
      '<label for="hora">Horário preferido</label><select id="hora"><option value="">Selecione</option><option>08:00</option><option>10:00</option><option>14:00</option><option>16:00</option></select>' +
      '<label for="obs">Observações (opcional)</label><textarea id="obs" rows="3" maxlength="300" placeholder="Ex.: alergias, cuidados especiais"></textarea>' +
      '<p class="erro" id="erro" role="alert"></p><button class="btn full" type="submit">Enviar solicitação (simulada)</button></form>');
    if (pet.especie) document.getElementById("esp").value = pet.especie;
    document.getElementById("f-sol").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var erro = document.getElementById("erro");
      if (v("pet").length < 2) { erro.textContent = "Informe o nome do pet."; return; }
      if (!v("data")) { erro.textContent = "Escolha uma data."; return; }
      if (v("data") < hoje()) { erro.textContent = "A data não pode estar no passado."; return; }
      if (!v("hora")) { erro.textContent = "Escolha um horário."; return; }
      var lista = solicitacoes();
      var id = "A" + String(lista.length + 1).padStart(3, "0");
      lista.unshift({ id: id, prestadorId: p.id, servicoId: s.id, pet: v("pet"), especie: v("esp"), data: v("data"), hora: v("hora"),
        obs: v("obs"), status: "solicitado", criada: new Date().toISOString(), pago: false, avaliacao: null });
      save("napata_solicitacoes", lista);
      ir("#/confirmacao/" + id);
    });
    return { titulo: "Solicitar", voltar: true, tab: "busca" };
  }

  function vConfirmacao(r) {
    var sol = solicitacoes().filter(function (x) { return x.id === r.arg; })[0];
    if (!sol) { ir("#/solicitacoes"); return {}; }
    var p = prestador(sol.prestadorId);
    set('<div class="card" style="text-align:center"><div style="font-size:3rem">&#9989;</div><h2>Solicitação enviada!</h2>' +
      '<p>Sua solicitação foi registrada com sucesso (simulação). Em breve, o prestador entrará em contato.</p>' +
      '<p class="muted">' + esc(p.nome) + " &middot; " + fmtData(sol.data) + " às " + esc(sol.hora) + '</p>' +
      '<p><span class="status solicitado">Solicitado</span></p></div>' +
      '<div class="aviso">Nada foi enviado a um prestador real.</div>' +
      '<a class="btn full" href="#/solicitacoes">Ver minhas solicitações</a><p></p><a class="btn sec full" href="#/home">Voltar para a home</a>');
    return { titulo: "Confirmação", tab: "solicitacoes" };
  }

  function vSolicitacoes() {
    function desenhar() {
      var lista = solicitacoes();
      set('<h2>Minhas solicitações</h2>' + (lista.length ? lista.map(function (x) {
        var p = prestador(x.prestadorId), s = servico(x.servicoId);
        var acoes = "";
        if (PROXIMO[x.status]) acoes += '<button class="btn sec" data-a="avancar" data-id="' + x.id + '" type="button">Avançar status (demo)</button> ';
        if (x.status === "confirmado" && !x.pago) acoes += '<button class="btn" data-a="pagar" data-id="' + x.id + '" type="button">Simular pagamento</button> ';
        if (x.status === "confirmado" && x.pago && !x.avaliacao) acoes += '<button class="btn sec" data-a="avaliar" data-id="' + x.id + '" type="button">Avaliar (demo)</button>';
        return '<div class="card"><div class="row between"><h3>' + esc(p.nome) + '</h3><span class="status ' + x.status + '">' + ROTULO[x.status] + '</span></div>' +
          '<div class="muted">' + esc(s.nome) + " &middot; " + esc(x.pet) + " (" + esc(x.especie) + ') &middot; ' + fmtData(x.data) + " " + esc(x.hora) + '</div>' +
          (x.obs ? '<div class="muted">Obs.: ' + esc(x.obs) + '</div>' : "") +
          (x.pago ? '<div class="muted">Pagamento simulado de ' + brl(p.preco) + ' (nenhuma cobrança real).</div>' : "") +
          (x.avaliacao ? '<div class="muted">Sua avaliação (demonstrativa): <span class="estrelas">' + "&#9733;".repeat(x.avaliacao.nota) + '</span> ' + esc(x.avaliacao.texto) + '</div>' : "") +
          (acoes ? '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' + acoes + '</div>' : "") + '</div>';
      }).join("") : '<div class="card">Você ainda não fez nenhuma solicitação. <a href="#/busca">Buscar serviços</a></div>') +
        '<div class="aviso">O status “confirmado” é apenas demonstrativo e não representa uma reserva real.</div>');
      [].forEach.call(view.querySelectorAll("button[data-a]"), function (b) {
        b.addEventListener("click", function () {
          var l = solicitacoes(), x = l.filter(function (y) { return y.id === b.getAttribute("data-id"); })[0];
          var a = b.getAttribute("data-a");
          if (a === "avancar") { x.status = PROXIMO[x.status]; toast("Status: " + ROTULO[x.status]); }
          if (a === "pagar") { x.pago = true; toast("Pagamento simulado. Nenhum dado bancário foi coletado."); }
          if (a === "avaliar") {
            var nota = parseInt(prompt("Nota de 1 a 5 (avaliação demonstrativa):", "5"), 10);
            if (!(nota >= 1 && nota <= 5)) { toast("Informe uma nota de 1 a 5."); return; }
            var texto = (prompt("Comentário (opcional):", "") || "").slice(0, 120);
            x.avaliacao = { nota: nota, texto: texto };
          }
          save("napata_solicitacoes", l); desenhar();
        });
      });
    }
    desenhar();
    return { titulo: "Solicitações", tab: "solicitacoes" };
  }

  function vChatbot() {
    var C = window.NaPataChatbot;
    set('<h2>Assistente NaPata</h2><div class="card"><div class="chat" id="chat" aria-live="polite"></div>' +
      '<div class="chips" id="chips"></div><form class="chat-form" id="f-chat"><input id="msg" placeholder="Digite sua dúvida" maxlength="120" aria-label="Mensagem"><button class="btn" type="submit">Enviar</button></form></div>' +
      '<div class="aviso">' + esc(C.aviso) + '</div>');
    var chat = document.getElementById("chat");
    function bolha(txt, tipo) {
      var d = document.createElement("div"); d.className = "bolha " + tipo; d.textContent = txt; chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
    }
    bolha("Olá! Eu sou o assistente do NaPata. Posso te ajudar com dúvidas sobre o aplicativo e os serviços. Escolha uma opção ou digite sua pergunta.", "bot");
    document.getElementById("chips").innerHTML = C.menu.map(function (m) { return '<button class="chip" type="button" data-k="' + m[0] + '">' + esc(m[1]) + '</button>'; }).join("");
    [].forEach.call(document.querySelectorAll(".chip"), function (c) {
      c.addEventListener("click", function () { bolha(c.textContent, "eu"); bolha(C.respostas[c.getAttribute("data-k")], "bot"); });
    });
    document.getElementById("f-chat").addEventListener("submit", function (e) {
      e.preventDefault();
      var i = document.getElementById("msg"), t = i.value.trim();
      if (!t) return;
      bolha(t, "eu"); bolha(C.responder(t), "bot"); i.value = "";
    });
    return { titulo: "Ajuda", tab: "chatbot" };
  }

  function vPerfil() {
    var u = usuario(), pet = u.pet || {};
    set('<h2>Perfil</h2><div class="card"><h3>' + esc(u.nome) + '</h3><p class="muted">' + esc(u.email) + '</p></div>' +
      '<form class="card" id="f-pet" novalidate><h3>Meu pet (opcional)</h3>' +
      '<label for="pn">Nome</label><input id="pn" maxlength="40" value="' + esc(pet.nome || "") + '">' +
      '<label for="pe">Espécie</label><select id="pe"><option>Cão</option><option>Gato</option></select>' +
      '<label for="pr">Raça (opcional)</label><input id="pr" maxlength="40" value="' + esc(pet.raca || "") + '">' +
      '<label for="pi">Idade em anos (opcional)</label><input id="pi" type="number" min="0" max="40" value="' + esc(pet.idade || "") + '">' +
      '<p></p><button class="btn full" type="submit">Salvar pet</button></form>' +
      '<div class="card"><h3>Privacidade (LGPD)</h3><p class="muted">Neste MVP seus dados ficam apenas no seu navegador e não são enviados a nenhum servidor. Você pode apagá-los a qualquer momento.</p>' +
      '<button class="btn sec full" id="sair" type="button">Sair</button><p></p><button class="btn sec full" id="apagar" type="button">Apagar todos os meus dados</button></div>' +
      '<p class="muted" style="text-align:center"><a href="#/sobre">Sobre este MVP</a></p>');
    if (pet.especie) document.getElementById("pe").value = pet.especie;
    document.getElementById("f-pet").addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = document.getElementById("pn").value.trim();
      var idade = document.getElementById("pi").value;
      if (nome.length < 2) { toast("Informe o nome do pet."); return; }
      if (idade !== "" && (+idade < 0 || +idade > 40)) { toast("Idade inválida."); return; }
      u.pet = { nome: nome, especie: document.getElementById("pe").value, raca: document.getElementById("pr").value.trim(), idade: idade };
      save("napata_user", u); toast("Pet salvo.");
    });
    document.getElementById("sair").onclick = function () { save("napata_sessao", false); toast("Você saiu."); ir("#/login"); };
    document.getElementById("apagar").onclick = function () {
      if (confirm("Apagar conta, pet e solicitações deste navegador?")) {
        ["napata_user", "napata_sessao", "napata_solicitacoes"].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        toast("Dados apagados."); ir("#/login");
      }
    };
    return { titulo: "Perfil", tab: "perfil" };
  }

  /* ---------- início ---------- */
  carregarDados().then(render).catch(function () {
    view.innerHTML = '<div class="card">Não foi possível carregar os dados de demonstração. Recarregue a página.</div>';
  });
})();
