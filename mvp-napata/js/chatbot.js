/* Chatbot de atendimento do NaPata (regras locais, sem IA generativa e sem envio de mensagens).
   Mesmas respostas do código Python do Apêndice A (Código 8). */
(function () {
  "use strict";
  var AVISO = "O NaPata não substitui orientação veterinária nem atende emergências. Em caso de urgência, procure imediatamente uma clínica veterinária 24h.";
  var RESPOSTAS = {
    buscar: "Para buscar um serviço, abra a aba Busca, escolha a categoria (banho e tosa, veterinário, pet shop, hospedagem ou adestramento) e use os filtros de cidade e ordenação.",
    agendar: "Para solicitar um agendamento, escolha um prestador, toque em “Solicitar serviço” e informe data, horário e observações. A solicitação fica como “solicitado” até o prestador responder (simulado).",
    precos: "Os preços exibidos são estimativas demonstrativas. Neste MVP nenhum pagamento real é processado e nenhum dado bancário é coletado.",
    status: "Para acompanhar uma solicitação, abra a aba Solicitações. Os status são: solicitado, em análise e confirmado (demonstrativo).",
    pet: "Para cadastrar seu pet, vá em Perfil > Meu pet e informe nome, espécie, raça e idade.",
    lgpd: "Seus dados são tratados conforme a LGPD (Lei 13.709/2018), apenas para as finalidades do termo de consentimento. Você pode pedir acesso, correção ou exclusão em contato@napata.com.br. Neste MVP os dados ficam só no seu navegador.",
    prestador: "Pet shops, clínicas e profissionais poderão se cadastrar como prestadores para divulgar serviços e receber solicitações (funcionalidade prevista; no MVP os prestadores são fictícios).",
    avaliacoes: "As avaliações exibidas são demonstrativas e não verificadas, pois nenhum serviço real é prestado.",
    problema: "Se o app apresentar erro, tente recarregar a página. Se continuar, escreva para contato@napata.com.br (simulado: resposta em até 24h).",
    humano: "Encaminhando você para um atendente humano… (simulado: no MVP não há atendimento humano real).",
    emergencia: "ATENÇÃO: " + AVISO
  };
  var MENU = [
    ["buscar", "Buscar um serviço"], ["agendar", "Solicitar um agendamento"], ["precos", "Preços e pagamento"],
    ["status", "Acompanhar solicitações"], ["pet", "Cadastrar meu pet"], ["lgpd", "Privacidade (LGPD)"],
    ["prestador", "Quero ser prestador"], ["avaliacoes", "Avaliações"], ["problema", "Problema no app"],
    ["humano", "Falar com atendente"], ["emergencia", "Emergência com meu pet"]
  ];
  var PALAVRAS = {
    emergencia: ["emergencia", "emergência", "urgente", "urgência", "envenen", "sangr", "atropel", "convuls", "engasg", "dor forte"],
    buscar: ["buscar", "procur", "encontr", "achar", "categoria"],
    agendar: ["agend", "marcar", "solicit", "horario", "horário", "reserv"],
    precos: ["preco", "preço", "valor", "pagar", "pagamento", "custa", "quanto"],
    status: ["status", "andamento", "acompanh", "pedido"],
    pet: ["meu pet", "cadastr", "cachorro", "gato", "animal", "cão"],
    lgpd: ["lgpd", "privacidade", "dados", "consentimento", "exclu"],
    prestador: ["prestador", "parceiro", "divulgar", "clínica", "clinica"],
    avaliacoes: ["avalia", "nota", "estrela", "coment"],
    problema: ["erro", "problema", "bug", "travou", "não funciona", "nao funciona"],
    humano: ["humano", "atendente", "pessoa"]
  };
  function responder(texto) {
    var t = String(texto || "").toLowerCase();
    var ordem = ["emergencia", "humano", "problema", "agendar", "precos", "status", "buscar", "lgpd", "avaliacoes", "prestador", "pet"];
    for (var i = 0; i < ordem.length; i++) {
      var chave = ordem[i];
      for (var j = 0; j < PALAVRAS[chave].length; j++) {
        if (t.indexOf(PALAVRAS[chave][j]) !== -1) return RESPOSTAS[chave];
      }
    }
    return "Não entendi bem. Escolha uma das opções abaixo ou reescreva a pergunta com outras palavras. " + AVISO;
  }
  window.NaPataChatbot = { respostas: RESPOSTAS, menu: MENU, responder: responder, aviso: AVISO };
})();
