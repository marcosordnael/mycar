# Meu Carro em Dia

## Objetivo
O **Meu Carro em Dia** é um aplicativo mobile focado em controlar e organizar as manutenções, as revisões e o histórico geral de serviços do seu veículo. Foi desenvolvido visando trazer clareza para o controle financeiro dos gastos e manter o motorista alerta para próximas revisões.

Este projeto foi desenvolvido como **atividade acadêmica** e estruturado utilizando técnicas e auxílio de ferramentas de IA generativa para otimização de código, scaffolding e validações base.

## Funcionalidades
- **Onboarding e Cadastro:** Primeiro acesso para vincular a marca, modelo, ano, placa e quilometragem atual do veículo base.
- **Painel Principal (Dashboard):** Visão geral contendo valor total gasto, último serviço, e sistema inteligente condicional de alertas coloridos (Atrasado, Próxima, ou Em dia).
- **Gestão de Manutenções:** Formulário robusto com validações numéricas reais de custos e distâncias para registros preventivos, corretivos, entre outros.
- **Histórico e Detalhes:** Lista temporal reversa de tudo já assinalado no carro, contendo recursos de leitura detalhada (notas/extratos) e função de exclusão (Delete).
- **Aba de Revisões:** Prioriza exibições de revisões alertadas. Avalia automaticamente se falta tempo ou se a quilometragem estourou.
- **Armazenamento Seguro e Offline:** Mantém um banco local (SQLite) sem nuvens ou dependências externas, respeitando a privacidade total do usuário local.

## Tecnologias Utilizadas
- **React Native** com **Expo**
- **TypeScript** para total coerência de tipos
- **Expo Router** (API de roteamento baseada em arquivos/layouts rápidos)
- **Expo SQLite** acessado localmente de forma sincronizada
- **Ionicons** nativos do pacote vetorizado do Expo
- **React Native Safe Area Context / Screens**

## Estrutura Resumida do Projeto
A arquitetura baseia-se na segregação de regras de interface (*UI*) de regras de dados (*Repositórios*):

```text
mycar/
├── app/                  # Roteamento baseado em arquivos (Expo Router)
│   ├── (tabs)/           # Layout das Abas Inferiores (Dashboard, Histórico, Revisões)
│   ├── index.tsx         # Roteador de Decisão de Login/Splash
│   ├── welcome.tsx       # Onboarding inicial
│   ├── add-vehicle.tsx   # Tela de cadastro inicial de veículo
│   ├── vehicle-settings.tsx # Tela de configuração/update de dados do veículo
│   ├── add-maintenance.tsx  # Tela de cadastro de manutenções
│   └── maintenance/      
│       └── [id].tsx      # Parâmetro dinâmico para visualização e exclusão do serviço
├── src/                  
│   ├── components/       # UI Reutilizável (Botões, Cards, TextFields)
│   ├── database/         # Instanciação SQLite e queries de Repositório
│   ├── types/            # Tipos Globais Modelados (Vehicle, MaintenanceRecord)
│   └── utils/            # Regras de Negócios / Helpers de formatação e data
```

## Como Executar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicialize o serviço do Expo:
   ```bash
   npx expo start --clear
   ```
3. Use o **Expo Go** em seu celular, lendo o QR Code do terminal, ou pressione a tecla `a` para emulador Android local e `i` para o simulador iOS.

## Como Testar
- **Primeiro Acesso:** Verifique o preenchimento apenas com os dados corretos no formulário de carro.
- **Inserir Manutenções:** Preencha quilometragem, valor (utilizando vírgulas ou pontos) e determine uma data *futura* para avaliar alertas nas Abas.
- **Avisos do Sistema:** Tente inserir um ano como `1800` ou custo `-20`, o sistema intervirá com os Alertas nativos.
- **Deleção:** No painel do histórico de manutenção, clique em qualquer ação para ver a tela expandida e o botão vermelho de descarte. Valide o Dashboard abaixando o custo acumulado.
- **Edição de Perfil:** Atualize a "Quilometragem Atual" do veículo para um valor onde cruze ou supere o que estabeleceu como "Próxima Revisão", testando os disparos simultâneos de `Atrasado`.

---
*Nota:* Este projeto engloba o entregável focado exclusivamente na estrutura de aprendizado e apoio contíguo de motores de IA na geração da arquitetura de base do código, sem focar em integrações com push notifications.