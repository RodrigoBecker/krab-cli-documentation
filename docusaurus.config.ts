import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Krab CLI',
  tagline: 'Toolkit CLI para Spec-Driven Development (SDD)',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://rodrigobecker.github.io',
  baseUrl: '/krab-cli-documentation/',

  organizationName: 'RodrigoBecker',
  projectName: 'krab-cli-documentation',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl:
            'https://github.com/RodrigoBecker/krab-cli-documentation/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      ({
        hashed: true,
        language: ["en", "pt"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      }),
    ],
  ],

  themeConfig: {
    image: 'img/krab-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Krab CLI',
      logo: {
        alt: 'Krab CLI Logo',
        src: 'img/krab-logo.png',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentacao',
        },
        {
          href: 'https://github.com/RodrigoBecker/krab-cli',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentacao',
          items: [
            {
              label: 'Introducao',
              to: '/',
            },
            {
              label: 'Instalacao',
              to: '/instalacao',
            },
            {
              label: 'Quick Start',
              to: '/quick-start',
            },
          ],
        },
        {
          title: 'Comandos',
          items: [
            {
              label: 'Workflows',
              to: '/comandos/workflow',
            },
            {
              label: 'Specs',
              to: '/comandos/spec',
            },
            {
              label: 'Analise',
              to: '/comandos/analyze',
            },
          ],
        },
        {
          title: 'Mais',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/RodrigoBecker/krab-cli',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Krab CLI. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'json', 'python', 'markdown'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
