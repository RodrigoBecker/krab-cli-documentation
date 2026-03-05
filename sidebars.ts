import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'instalacao',
    'quick-start',
    {
      type: 'category',
      label: 'Comandos',
      collapsed: false,
      items: [
        'comandos/optimize',
        'comandos/convert',
        'comandos/analyze',
        'comandos/search',
        'comandos/diff',
        'comandos/spec',
        'comandos/memory',
        'comandos/agent',
        'comandos/cache',
        'comandos/workflow',
      ],
    },
    {
      type: 'category',
      label: 'Guias',
      collapsed: false,
      items: [
        'guias/slash-commands',
        'guias/walkthrough',
      ],
    },
    {
      type: 'category',
      label: 'Referencia',
      collapsed: false,
      items: [
        'referencia/algoritmos',
        'referencia/arquitetura',
      ],
    },
  ],
};

export default sidebars;
