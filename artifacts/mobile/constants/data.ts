export type PostType = 'adoption' | 'lost' | 'found' | 'emergency' | 'campaign' | 'post';

export interface Author {
  id: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  type: 'person' | 'ong' | 'vet';
}

export interface Post {
  id: string;
  type: PostType;
  animalType: 'dog' | 'cat' | 'other';
  name: string;
  breed: string;
  age: string;
  description: string;
  location: string;
  neighborhood: string;
  image: string | null;
  textOnly: boolean;
  author: Author;
  likes: number;
  comments: number;
  shares: number;
  urgent: boolean;
  createdAt: string;
  contact: string;
  tags: string[];
}

export interface ChatConversation {
  id: string;
  postId: string;
  participant: Author;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  postTitle: string;
}

export interface ONG {
  id: string;
  name: string;
  shortName: string;
  description: string;
  mission: string;
  location: string;
  city: string;
  state: string;
  verified: boolean;
  animalsRescued: number;
  activeCases: number;
  adoptions: number;
  animalTypes: string[];
  followers: number;
  since: string;
  cnpj: string;
  contact: string;
  cause: string;
}

export const MOCK_AUTHORS: Author[] = [
  { id: 'u1', name: 'Instituto Amigos dos Animais', avatar: null, verified: true, type: 'ong' },
  { id: 'u2', name: 'Protetora Fernanda Lima', avatar: null, verified: true, type: 'person' },
  { id: 'u3', name: 'ONG Patinhas Felizes', avatar: null, verified: true, type: 'ong' },
  { id: 'u4', name: 'Dr. Carlos Veterinário', avatar: null, verified: true, type: 'vet' },
  { id: 'u5', name: 'Mariana Santos', avatar: null, verified: false, type: 'person' },
  { id: 'u6', name: 'Abrigo Municipal SP', avatar: null, verified: true, type: 'ong' },
];

export const AUTHOR_TO_ONG: Record<string, string> = {
  u1: 'o1',
  u3: 'o2',
  u6: 'o3',
};

export const MOCK_ONGS: ONG[] = [
  {
    id: 'o1',
    name: 'Instituto Amigos dos Animais',
    shortName: 'IAA',
    description: 'Maior rede de proteção animal do Brasil, com 12 anos de atuação e mais de 15 mil animais resgatados.',
    mission: 'Resgatar, tratar e recolocar animais em lares amorosos.',
    location: 'Vila Mariana, São Paulo, SP',
    city: 'São Paulo',
    state: 'SP',
    verified: true,
    animalsRescued: 15240,
    activeCases: 87,
    adoptions: 9430,
    animalTypes: ['Cachorros', 'Gatos'],
    followers: 48200,
    since: '2012',
    cnpj: '12.345.678/0001-90',
    contact: '(11) 99999-0001',
    cause: 'Adoção responsável e resgate urbano',
  },
  {
    id: 'o2',
    name: 'ONG Patinhas Felizes',
    shortName: 'Patinhas',
    description: 'Especializada no resgate e reabilitação de animais vítimas de maus-tratos na Grande São Paulo.',
    mission: 'Dar uma segunda chance para quem mais precisa.',
    location: 'Cambuí, Campinas, SP',
    city: 'Campinas',
    state: 'SP',
    verified: true,
    animalsRescued: 4780,
    activeCases: 34,
    adoptions: 3210,
    animalTypes: ['Cachorros', 'Gatos', 'Outros'],
    followers: 21000,
    since: '2016',
    cnpj: '98.765.432/0001-10',
    contact: '(19) 98888-0002',
    cause: 'Combate a maus-tratos e adoção',
  },
  {
    id: 'o3',
    name: 'Abrigo Municipal SP',
    shortName: 'AMSP',
    description: 'Abrigo público conveniado com a Prefeitura de São Paulo, capacidade para 200 animais com suporte veterinário completo.',
    mission: 'Zelar por animais abandonados e promover adoção consciente.',
    location: 'Mooca, São Paulo, SP',
    city: 'São Paulo',
    state: 'SP',
    verified: true,
    animalsRescued: 32100,
    activeCases: 198,
    adoptions: 27600,
    animalTypes: ['Cachorros', 'Gatos'],
    followers: 89500,
    since: '2004',
    cnpj: '00.111.222/0001-33',
    contact: '(11) 97777-0003',
    cause: 'Bem-estar animal público',
  },
  {
    id: 'o4',
    name: 'Clínica Vet Solidária',
    shortName: 'VetSol',
    description: 'Rede de clínicas veterinárias que atende animais de rua e de famílias em vulnerabilidade social de graça.',
    mission: 'Saúde animal acessível para todos.',
    location: 'Lapa, São Paulo, SP',
    city: 'São Paulo',
    state: 'SP',
    verified: true,
    animalsRescued: 8900,
    activeCases: 55,
    adoptions: 1200,
    animalTypes: ['Cachorros', 'Gatos', 'Outros'],
    followers: 14300,
    since: '2019',
    cnpj: '55.444.333/0001-22',
    contact: '(11) 96666-0004',
    cause: 'Saúde e bem-estar veterinário',
  },
  {
    id: 'o5',
    name: 'Resgate Animal Brasil',
    shortName: 'RAB',
    description: 'Atua em emergências e desastres naturais para resgatar e acolher animais em situação de risco extremo.',
    mission: 'Estar presente quando os animais mais precisam.',
    location: 'Centro, Rio de Janeiro, RJ',
    city: 'Rio de Janeiro',
    state: 'RJ',
    verified: true,
    animalsRescued: 6200,
    activeCases: 22,
    adoptions: 4100,
    animalTypes: ['Cachorros', 'Gatos', 'Outros'],
    followers: 37800,
    since: '2014',
    cnpj: '77.888.999/0001-44',
    contact: '(21) 95555-0005',
    cause: 'Resgate em emergências e desastres',
  },
  {
    id: 'o6',
    name: 'Fundo Animal BR',
    shortName: 'FABR',
    description: 'Conecta doadores a ONGs verificadas, garantindo transparência total no uso dos recursos para proteção animal.',
    mission: 'Financiar a proteção animal com transparência e impacto real.',
    location: 'Pinheiros, São Paulo, SP',
    city: 'São Paulo',
    state: 'SP',
    verified: true,
    animalsRescued: 0,
    activeCases: 0,
    adoptions: 0,
    animalTypes: ['Todos'],
    followers: 26100,
    since: '2020',
    cnpj: '33.222.111/0001-55',
    contact: '(11) 94444-0006',
    cause: 'Captação e distribuição de recursos',
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    type: 'adoption',
    animalType: 'dog',
    name: 'Mel',
    breed: 'Vira-lata Caramelo',
    age: '2 anos',
    description: 'Mel é uma cachorrinha muito dócil e carinhosa. Vacinada, castrada e com microchip. Adora crianças e se dá bem com outros cães. Busca um lar cheio de amor e carinho.',
    location: 'São Paulo, SP',
    neighborhood: 'Vila Mariana',
    image: null,
    textOnly: false,
    author: MOCK_AUTHORS[0],
    likes: 127,
    comments: 23,
    shares: 45,
    urgent: false,
    createdAt: '2h atrás',
    contact: '(11) 99999-0001',
    tags: ['vacinada', 'castrada', 'dócil', 'crianças'],
  },
  {
    id: '2',
    type: 'emergency',
    animalType: 'cat',
    name: 'Sem nome',
    breed: 'Gatinho tigrado',
    age: 'Estimado 3 meses',
    description: 'Gatinho encontrado ferido na Av. Paulista. Está com a patinha traseira machucada. Precisa de atendimento veterinário urgente! Quem puder ajudar, entre em contato.',
    location: 'São Paulo, SP',
    neighborhood: 'Bela Vista',
    image: null,
    textOnly: false,
    author: MOCK_AUTHORS[1],
    likes: 340,
    comments: 67,
    shares: 210,
    urgent: true,
    createdAt: '45min atrás',
    contact: '(11) 98888-0002',
    tags: ['emergência', 'ferido', 'precisadeajuda'],
  },
  {
    id: 'text1',
    type: 'campaign',
    animalType: 'other',
    name: 'Aviso importante',
    breed: '',
    age: '',
    description: 'Atenção moradores do bairro Mooca! Estamos vendo um aumento de animais soltos na Rua das Acácias. Por favor, se você tiver ração sobrando ou puder adotar temporariamente, entre em contato. Juntos salvamos mais vidas 🐾',
    location: 'São Paulo, SP',
    neighborhood: 'Mooca',
    image: null,
    textOnly: true,
    author: MOCK_AUTHORS[5],
    likes: 89,
    comments: 14,
    shares: 52,
    urgent: false,
    createdAt: '30min atrás',
    contact: '(11) 94444-0006',
    tags: ['aviso', 'comunidade', 'mooca'],
  },
  {
    id: '3',
    type: 'lost',
    animalType: 'dog',
    name: 'Thor',
    breed: 'Golden Retriever',
    age: '4 anos',
    description: 'PERDIDO! Thor fugiu ontem à tarde no Parque Ibirapuera. Tem coleira azul e microchip. É muito dócil e vai até qualquer pessoa. Recompensa para quem encontrar.',
    location: 'São Paulo, SP',
    neighborhood: 'Ibirapuera',
    image: null,
    textOnly: false,
    author: MOCK_AUTHORS[4],
    likes: 892,
    comments: 134,
    shares: 567,
    urgent: true,
    createdAt: '1 dia atrás',
    contact: '(11) 97777-0003',
    tags: ['perdido', 'recompensa', 'ibirapuera'],
  },
  {
    id: 'text2',
    type: 'adoption',
    animalType: 'other',
    name: 'Feira de Adoção',
    breed: '',
    age: '',
    description: 'Sábado tem Feira de Adoção no Parque Villa-Lobos! Das 9h às 17h, com mais de 40 animais à espera de um lar. Venha com a família, entrada gratuita. Apoio veterinário no local para check-up na hora 🐶🐱',
    location: 'São Paulo, SP',
    neighborhood: 'Villa-Lobos',
    image: null,
    textOnly: true,
    author: MOCK_AUTHORS[2],
    likes: 431,
    comments: 88,
    shares: 276,
    urgent: false,
    createdAt: '3h atrás',
    contact: '(19) 98888-0002',
    tags: ['feira', 'adoção', 'villalobos', 'sábado'],
  },
  {
    id: '4',
    type: 'found',
    animalType: 'cat',
    name: 'Desconhecido',
    breed: 'Siamês',
    age: 'Adulto',
    description: 'Encontrei este gato siamês no Jardins. Está bem alimentado e é muito manso, parece ser pet. Se for seu, entre em contato. Está guardado em local seguro.',
    location: 'São Paulo, SP',
    neighborhood: 'Jardins',
    image: null,
    textOnly: false,
    author: MOCK_AUTHORS[4],
    likes: 56,
    comments: 12,
    shares: 34,
    urgent: false,
    createdAt: '3h atrás',
    contact: '(11) 96666-0004',
    tags: ['encontrado', 'siamês', 'jardins'],
  },
  {
    id: '5',
    type: 'adoption',
    animalType: 'dog',
    name: 'Pipoca',
    breed: 'Poodle mix',
    age: '1 ano',
    description: 'Pipoca é um cão alegre e brincalhão. Resgatado das ruas quando filhote. Está saudável, vacinado e pronto para um novo lar. Aceitamos famílias com crianças.',
    location: 'Campinas, SP',
    neighborhood: 'Cambuí',
    image: null,
    textOnly: false,
    author: MOCK_AUTHORS[2],
    likes: 203,
    comments: 41,
    shares: 88,
    urgent: false,
    createdAt: '5h atrás',
    contact: '(19) 95555-0005',
    tags: ['vacinado', 'resgatado', 'brincalhão'],
  },
  {
    id: '6',
    type: 'campaign',
    animalType: 'other',
    name: 'Campanha Ração Solidária',
    breed: 'Todos os animais',
    age: 'Vários',
    description: 'Nosso abrigo está com estoque de ração crítico. Temos 85 animais para alimentar. Precisamos de doações de ração ou financeiras. Cada ajuda faz diferença!',
    location: 'São Paulo, SP',
    neighborhood: 'Mooca',
    image: null,
    textOnly: false,
    author: MOCK_AUTHORS[5],
    likes: 412,
    comments: 78,
    shares: 305,
    urgent: false,
    createdAt: '1 dia atrás',
    contact: '(11) 94444-0006',
    tags: ['campanha', 'doação', 'ração', 'abrigo'],
  },
  {
    id: 'post1',
    type: 'post',
    animalType: 'dog',
    name: 'Dica de hoje',
    breed: '',
    age: '',
    description: 'Lembrete importante: cães precisam de água fresca disponível o dia todo, especialmente no verão. Parece óbvio, mas muitos tutores esquecem de trocar a água diariamente. Um gesto simples que pode salvar a vida do seu pet 🐾',
    location: 'São Paulo, SP',
    neighborhood: 'Pinheiros',
    image: null,
    textOnly: true,
    author: MOCK_AUTHORS[3],
    likes: 284,
    comments: 37,
    shares: 91,
    urgent: false,
    createdAt: '1h atrás',
    contact: '',
    tags: ['dica', 'saúde', 'pet', 'verão'],
  },
  {
    id: 'post2',
    type: 'post',
    animalType: 'cat',
    name: 'Relato',
    breed: '',
    age: '',
    description: 'Hoje completou 6 meses que adotei a Lua pelo ZooHelp. O que antes era um gatinho assustado que se escondia debaixo da cama hoje me acorda com ronronar e dorme no meu travesseiro. Adoção transforma — a vida do animal e a sua 🐱',
    location: 'São Paulo, SP',
    neighborhood: 'Itaim Bibi',
    image: null,
    textOnly: true,
    author: MOCK_AUTHORS[4],
    likes: 612,
    comments: 94,
    shares: 188,
    urgent: false,
    createdAt: '20min atrás',
    contact: '',
    tags: ['adoção', 'relato', 'gato', 'amor'],
  },
  {
    id: 'post3',
    type: 'post',
    animalType: 'other',
    name: 'Atualização',
    breed: '',
    age: '',
    description: 'Boa notícia! Conseguimos vacinar 47 animais de rua neste fim de semana graças ao mutirão de voluntários. Obrigado a todos que apareceram cedo na praça. Próxima ação será em 15 dias — salve na agenda! 🏥🐶🐱',
    location: 'São Paulo, SP',
    neighborhood: 'Vila Mariana',
    image: null,
    textOnly: true,
    author: MOCK_AUTHORS[0],
    likes: 893,
    comments: 121,
    shares: 347,
    urgent: false,
    createdAt: '4h atrás',
    contact: '(11) 99999-0001',
    tags: ['vacinação', 'voluntários', 'ação', 'comunidade'],
  },
];

export const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'c1',
    postId: '1',
    participant: MOCK_AUTHORS[0],
    lastMessage: 'Olá! Tenho interesse em adotar a Mel. Podemos conversar?',
    lastMessageTime: '14:32',
    unread: 2,
    postTitle: 'Mel - Adoção',
  },
  {
    id: 'c2',
    postId: '3',
    participant: MOCK_AUTHORS[4],
    lastMessage: 'Vi o post do Thor! Acho que o vi no parque hoje cedo.',
    lastMessageTime: '12:15',
    unread: 0,
    postTitle: 'Thor - Perdido',
  },
  {
    id: 'c3',
    postId: '6',
    participant: MOCK_AUTHORS[5],
    lastMessage: 'Quero contribuir com ração. Como faço?',
    lastMessageTime: 'Ontem',
    unread: 1,
    postTitle: 'Campanha Ração Solidária',
  },
];

export const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string; bgColor: string }> = {
  adoption: { label: 'Adoção', color: '#FFFFFF', bgColor: '#4CAF50' },
  lost: { label: 'Perdido', color: '#FFFFFF', bgColor: '#FF9800' },
  found: { label: 'Encontrado', color: '#FFFFFF', bgColor: '#2F80ED' },
  emergency: { label: 'Emergência', color: '#FFFFFF', bgColor: '#FF3B30' },
  campaign: { label: 'Campanha', color: '#FFFFFF', bgColor: '#9B59B6' },
  post: { label: 'Escrever', color: '#FFFFFF', bgColor: '#6E6E73' },
};
