# Meu Carro em Dia

Aplicativo mobile para controle de manutenção automotiva, com cadastro de veículo, histórico de serviços e alertas de revisão.

## Visão Geral
O projeto foi construído com Expo + React Native e usa SQLite local para funcionar offline.  
No primeiro acesso, o usuário cadastra o veículo com dados da tabela FIPE (marca, modelo e ano), define placa e quilometragem inicial, e passa a acompanhar custos e próximas revisões no dashboard.

## Funcionalidades
- Onboarding inicial com redirecionamento automático (`welcome` ou `dashboard`) de acordo com existência de veículo.
- Cadastro de veículo com integração FIPE (`marca -> modelo -> ano`), com deduplicação de modelos/anos.
- Seleção de veículo ativo no dashboard e edição dos dados do veículo.
- Cadastro de manutenções com custo, quilometragem, observações e próxima revisão por data/km.
- Dashboard com métricas (total gasto, serviços, revisões atrasadas e próximas).
- Histórico de manutenções e tela de detalhe com opção de exclusão.
- Aba de revisões com priorização de status (`ATRASADA`, `PROXIMA`, `EM_DIA`).
- Persistência offline em SQLite com recuperação automática de conexão em erros nativos.

## Stack
- Expo `~54`
- React Native `0.81`
- Expo Router
- Expo SQLite
- TypeScript
- `react-native-safe-area-context`
- `@expo/vector-icons`

## Estrutura do Projeto
```text
mycar/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── welcome.tsx
│   ├── add-vehicle.tsx
│   ├── vehicle-settings.tsx
│   ├── add-maintenance.tsx
│   ├── maintenance/[id].tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── maintenances.tsx
│       └── upcoming.tsx
├── src/
│   ├── components/
│   ├── database/
│   │   ├── db.ts
│   │   └── repositories/
│   ├── services/
│   ├── types/
│   └── utils/
└── README.md
```

## Banco de Dados (SQLite)
Tabelas principais:
- `vehicle`
- `maintenance_record`
- `app_settings` (mantém `selectedVehicleId`)

Arquivo de inicialização e migração:
- `src/database/db.ts`

## Como Executar
1. Instalar dependências:
```bash
npm install
```

2. Iniciar o projeto:
```bash
npx expo start --clear
```

3. Rodar no dispositivo:
- Tecla `a`: Android Emulator
- Tecla `i`: iOS Simulator
- Ou Expo Go via QR Code

## Scripts Disponíveis
```bash
npm run start
npm run android
npm run ios
npm run web
```

## Fluxo de Uso (Rápido)
1. Cadastrar veículo na tela inicial.
2. Acessar dashboard e confirmar veículo selecionado.
3. Registrar uma manutenção.
4. Verificar impacto em:
- métricas do dashboard
- histórico de serviços
- aba de revisões

## Observações
- Caso o editor mostre `Cannot find module '@expo/vector-icons'`, execute:
```bash
npx expo install @expo/vector-icons
```
- Reinicie o bundler (`npx expo start --clear`) após instalar dependências novas.

---
Projeto acadêmico com foco em arquitetura mobile, persistência local e boas práticas de organização por camadas (UI, serviços, repositórios e utilitários).
