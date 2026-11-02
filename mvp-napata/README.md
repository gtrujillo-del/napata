# NaPata: MVP demonstrativo

MVP acadêmico do **NaPata (Pet Personal Care)**, aplicativo para buscar, comparar e solicitar serviços para cães e gatos
(foco inicial: Região Metropolitana do Rio de Janeiro).
Projeto da disciplina **Tecnologia da Informação e Negócios** (UFF), curso de Processos Gerenciais com ênfase em Empreendedorismo.

> **Atenção:** demonstração. Todos os dados (prestadores, preços, avaliações) são **fictícios**. Não há pagamentos reais, nem envio de
> solicitações a prestadores, nem integrações externas. O login é simplificado e **não é seguro**; os dados ficam só no navegador (localStorage).

## O que o MVP faz
- Cadastro e login simplificados (com aceite do termo de consentimento LGPD)
- Busca com filtros (categoria, cidade, nome/bairro) e ordenação por nota ou preço
- Detalhe do prestador e solicitação de serviço com validação de campos
- Minhas solicitações com status (solicitado → em análise → confirmado, demonstrativo)
- Pagamento e avaliação **simulados**
- Chatbot de atendimento por regras (sem IA generativa)
- Dados em `data/napata_dados.xml`

## Como rodar
- Online: abra o link do GitHub Pages do repositório.
- Local: abra `index.html` no navegador (ou rode `python3 -m http.server` e acesse `http://localhost:8000`).

## Estrutura
```
index.html
css/estilo.css
js/app.js, js/chatbot.js, js/dados_fallback.js
data/napata_dados.xml
assets/
```

## Alunas
Gabriela Noguera Trujillo e Samara do Nascimento Andrade. Professor: Gabriel Marcuzzo do Canto Cavalheiro.
