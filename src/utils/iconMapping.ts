import { CropIcon as IconProps } from 'lucide-react';

interface IconMapping {
  icon: string;
  color: string;
}

// Mapping des secteurs vers les icônes
const sectorIconMappings: { keywords: string[]; icon: IconMapping }[] = [
  {
    keywords: ['industrie', 'usine', 'manufacture', 'production'],
    icon: { icon: 'Factory', color: 'text-blue-600' }
  },
  {
    keywords: ['tertiaire', 'service', 'bureau', 'commerce'],
    icon: { icon: 'Building2', color: 'text-purple-600' }
  },
  {
    keywords: ['transport', 'logistique', 'mobilite', 'vehicule'],
    icon: { icon: 'Truck', color: 'text-indigo-600' }
  },
  {
    keywords: ['agriculture', 'ferme', 'culture', 'elevage'],
    icon: { icon: 'Wheat', color: 'text-green-600' }
  },
  {
    keywords: ['energie', 'electricite', 'gaz', 'petrole'],
    icon: { icon: 'Zap', color: 'text-amber-600' }
  },
  {
    keywords: ['banque', 'finance', 'assurance', 'investissement'],
    icon: { icon: 'Landmark', color: 'text-cyan-600' }
  }
];

const issueIconMappings: { keywords: string[]; icon: IconMapping }[] = [
  {
    keywords: ['gouvernance', 'direction', 'management', 'administration'],
    icon: { icon: 'Scale', color: 'text-blue-600' }
  },
  {
    keywords: ['ethique', 'morale', 'deontologie', 'integrite'],
    icon: { icon: 'HeartHandshake', color: 'text-purple-600' }
  },
  {
    keywords: ['travail', 'emploi', 'salarie', 'personnel', 'rh'],
    icon: { icon: 'UserCheck', color: 'text-indigo-600' }
  },
  {
    keywords: ['environnement', 'nature', 'foret', 'biodiversite'],
    icon: { icon: 'Trees', color: 'text-green-600' }
  },
  {
    keywords: ['climat', 'temperature', 'meteo', 'rechauffement'],
    icon: { icon: 'CloudSun', color: 'text-amber-600' }
  },
  {
    keywords: ['dechet', 'recyclage', 'pollution', 'traitement'],
    icon: { icon: 'Recycle', color: 'text-cyan-600' }
  }
];

const standardIconMappings: { keywords: string[]; icon: IconMapping }[] = [
  {
    keywords: ['iso', 'certification', 'qualite'],
    icon: { icon: 'Award', color: 'text-blue-600' }
  },
  {
    keywords: ['gri', 'reporting', 'global'],
    icon: { icon: 'FileText', color: 'text-purple-600' }
  },
  {
    keywords: ['bilan', 'carbone', 'ghg', 'ges'],
    icon: { icon: 'LineChart', color: 'text-indigo-600' }
  },
  {
    keywords: ['bcorp', 'corporation', 'benefit'],
    icon: { icon: 'Medal', color: 'text-green-600' }
  },
  {
    keywords: ['esg', 'score', 'rating'],
    icon: { icon: 'BarChart', color: 'text-amber-600' }
  },
  {
    keywords: ['sdg', 'odd', 'developpement', 'durable'],
    icon: { icon: 'Globe', color: 'text-cyan-600' }
  }
];

const defaultIcon: IconMapping = { icon: 'CircleDot', color: 'text-gray-600' };

function findBestMatch(name: string, mappings: { keywords: string[]; icon: IconMapping }[]): IconMapping {
  const normalizedInput = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const words = normalizedInput.split(/\s+/);
  let bestMatch: { score: number; icon: IconMapping } = { score: 0, icon: defaultIcon };

  for (const mapping of mappings) {
    let score = 0;
    for (const word of words) {
      if (mapping.keywords.some(keyword => keyword.includes(word) || word.includes(keyword))) {
        score += 1;
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { score, icon: mapping.icon };
    }
  }

  return bestMatch.icon;
}

export function getIconForSector(name: string): IconMapping {
  return findBestMatch(name, sectorIconMappings);
}

export function getIconForIssue(name: string): IconMapping {
  return findBestMatch(name, issueIconMappings);
}

export function getIconForStandard(name: string): IconMapping {
  return findBestMatch(name, standardIconMappings);
}