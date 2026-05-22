import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BrazilCity {
  id: string;
  name: string;
  state: string;
  label: string;
  latitude?: number;
  longitude?: number;
}

const CACHE_KEY = 'zoohelp:brazilCities:v1';
const IBGE_MUNICIPALITIES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';

const CITY_SEED: BrazilCity[] = [
  { id: '3509502', name: 'Campinas', state: 'SP', label: 'Campinas, SP', latitude: -22.9056, longitude: -47.0608 },
  { id: '3550308', name: 'Sao Paulo', state: 'SP', label: 'Sao Paulo, SP', latitude: -23.5505, longitude: -46.6333 },
  { id: '3304557', name: 'Rio de Janeiro', state: 'RJ', label: 'Rio de Janeiro, RJ', latitude: -22.9068, longitude: -43.1729 },
  { id: '3106200', name: 'Belo Horizonte', state: 'MG', label: 'Belo Horizonte, MG', latitude: -19.9167, longitude: -43.9345 },
  { id: '4106902', name: 'Curitiba', state: 'PR', label: 'Curitiba, PR', latitude: -25.4284, longitude: -49.2733 },
  { id: '4314902', name: 'Porto Alegre', state: 'RS', label: 'Porto Alegre, RS', latitude: -30.0346, longitude: -51.2177 },
  { id: '2927408', name: 'Salvador', state: 'BA', label: 'Salvador, BA', latitude: -12.9777, longitude: -38.5016 },
  { id: '2304400', name: 'Fortaleza', state: 'CE', label: 'Fortaleza, CE', latitude: -3.7319, longitude: -38.5267 },
  { id: '2611606', name: 'Recife', state: 'PE', label: 'Recife, PE', latitude: -8.0476, longitude: -34.877 },
  { id: '5300108', name: 'Brasilia', state: 'DF', label: 'Brasilia, DF', latitude: -15.7939, longitude: -47.8828 },
  { id: '1302603', name: 'Manaus', state: 'AM', label: 'Manaus, AM', latitude: -3.119, longitude: -60.0217 },
  { id: '1501402', name: 'Belem', state: 'PA', label: 'Belem, PA', latitude: -1.4558, longitude: -48.4902 },
  { id: '5208707', name: 'Goiania', state: 'GO', label: 'Goiania, GO', latitude: -16.6869, longitude: -49.2648 },
  { id: '3505708', name: 'Barueri', state: 'SP', label: 'Barueri, SP', latitude: -23.5112, longitude: -46.8764 },
  { id: '3548708', name: 'Sao Bernardo do Campo', state: 'SP', label: 'Sao Bernardo do Campo, SP', latitude: -23.6914, longitude: -46.5646 },
  { id: '3501608', name: 'Americana', state: 'SP', label: 'Americana, SP', latitude: -22.7374, longitude: -47.3331 },
  { id: '3552403', name: 'Sumare', state: 'SP', label: 'Sumare, SP', latitude: -22.8219, longitude: -47.2669 },
  { id: '3525904', name: 'Jundiai', state: 'SP', label: 'Jundiai, SP', latitude: -23.1857, longitude: -46.8978 },
  { id: '3543402', name: 'Ribeirao Preto', state: 'SP', label: 'Ribeirao Preto, SP', latitude: -21.1699, longitude: -47.8099 },
  { id: '3549904', name: 'Sao Jose dos Campos', state: 'SP', label: 'Sao Jose dos Campos, SP', latitude: -23.2237, longitude: -45.9009 },
];

let memoryCache: BrazilCity[] | null = null;

export async function searchBrazilCities(query: string, limit = 8): Promise<BrazilCity[]> {
  const term = normalize(query);
  if (term.length < 2) return [];

  const seedMatches = rankCities(CITY_SEED, term);
  if (seedMatches.length >= Math.min(limit, 4)) {
    return seedMatches.slice(0, limit);
  }

  const allCities = await loadCities().catch(() => CITY_SEED);
  return rankCities(allCities, term).slice(0, limit);
}

async function loadCities(): Promise<BrazilCity[]> {
  if (memoryCache) return memoryCache;
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached) as BrazilCity[];
    if (Array.isArray(parsed) && parsed.length > 1000) {
      memoryCache = mergeCities(CITY_SEED, parsed);
      return memoryCache;
    }
  }

  const response = await fetch(IBGE_MUNICIPALITIES_URL);
  if (!response.ok) throw new Error('IBGE city search failed');
  const payload = (await response.json()) as Array<{
    id: number;
    nome: string;
    microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
  }>;
  const cities = payload.map((item) => {
    const state = item.microrregiao?.mesorregiao?.UF?.sigla ?? '';
    return {
      id: String(item.id),
      name: asciiName(item.nome),
      state,
      label: `${asciiName(item.nome)}, ${state}`,
    };
  });
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cities));
  memoryCache = mergeCities(CITY_SEED, cities);
  return memoryCache;
}

function rankCities(cities: BrazilCity[], term: string) {
  return cities
    .map((city) => {
      const name = normalize(city.name);
      const label = normalize(city.label);
      const score = name === term ? 0 : name.startsWith(term) ? 1 : label.includes(term) ? 2 : 9;
      return { city, score };
    })
    .filter((item) => item.score < 9)
    .sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name))
    .map((item) => item.city);
}

function mergeCities(priority: BrazilCity[], rest: BrazilCity[]) {
  const seen = new Set<string>();
  return [...priority, ...rest].filter((city) => {
    const key = `${normalize(city.name)}-${city.state}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalize(value: string) {
  return asciiName(value).toLowerCase().trim();
}

function asciiName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
