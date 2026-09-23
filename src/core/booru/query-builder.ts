export type BooruProvider = 'safebooru' | 'zerochan' | 'eshuushuu';

export interface DisambiguatedQuery {
  endpoint: BooruProvider;
  formattedQuery: string;
  antiBanDelayMs: number;
}

/**
 * Clean character tag resolver for each provider to guarantee clean search results
 */
export function getCleanCharacterTag(
  characterId: string,
  characterNameEn: string,
  provider: BooruProvider
): string {
  const normalizedId = (characterId || '').toLowerCase().trim();

  if (provider === 'eshuushuu') {
    // E-shuushuu uses canonical character names or simple names
    const eshuushuuMap: Record<string, string> = {
      'rem': 'Rem',
      'ram': 'Ram',
      'emilia': 'Emilia',
      'natsuki-subaru': 'Natsuki Subaru',
      'beatrice': 'Beatrice',
      'echidna': 'Echidna',
      'felt': 'Felt',
      'crusch-karsten': 'Crusch Karsten',
      'felix-argyle': 'Felix Argyle',
      'priscilla-barielle': 'Priscilla Barielle',
      'anastasia-hoshin': 'Anastasia Hoshin',
      'julius-juukulius': 'Julius Juukulius',
      'reinhard-van-astrea': 'Reinhard van Astrea',
      'satella': 'Satella',
      'theresia-van-astrea': 'Theresia van Astrea',
      'wilhelm-van-astrea': 'Wilhelm van Astrea',
      'otto-suwen': 'Otto Suwen',
      'garfiel-tinsel': 'Garfiel Tinsel',
      'frederica-baumann': 'Frederica Baumann',
      'petra-leyte': 'Petra Leyte',
      'shaula': 'Shaula',
      'carmilla': 'Carmilla',
      'minerva': 'Minerva',
      'daphne': 'Daphne',
      'typhon': 'Typhon',
      'sekhmet': 'Sekhmet',
      'pandora': 'Pandora',
      'hector': 'Hector',
      'petelgeuse-romanee-conti': 'Petelgeuse Romanee-Conti',
      'regulus-corneas': 'Regulus Corneas',
      'capella-emerada-lugnica': 'Capella Emerada Lugnica',
      'sirius-romanee-conti': 'Sirius Romanee-Conti',
      'lye-batenkaitos': 'Lye Batenkaitos',
      'roy-alphard': 'Roy Alphard',
      'louis-arneb': 'Louis Arneb',
      'elsa-granhiert': 'Elsa Granhiert',
      'meili-portroute': 'Meili Portroute',
      'aldebaran': 'Aldebaran',
      'mimi-pearlbaton': 'Mimi Pearlbaton',
      'hetaro-pearlbaton': 'Hetaro Pearlbaton',
      'tivey-pearlbaton': 'Tivey Pearlbaton',
      'ricardo-welkin': 'Ricardo Welkin',
    };
    return eshuushuuMap[normalizedId] || characterNameEn || 'Rem';
  }

  if (provider === 'zerochan') {
    // Zerochan uses Series-disambiguated names for high-collision characters
    const zerochanMap: Record<string, string> = {
      'rem': 'Rem (Re:Zero)',
      'ram': 'Ram (Re:Zero)',
      'emilia': 'Emilia (Re:Zero)',
      'natsuki-subaru': 'Natsuki Subaru',
      'beatrice': 'Beatrice (Re:Zero)',
      'echidna': 'Echidna (Re:Zero)',
      'felt': 'Felt (Re:Zero)',
      'crusch-karsten': 'Crusch Karsten',
      'felix-argyle': 'Felix Argyle',
      'priscilla-barielle': 'Priscilla Barielle',
      'anastasia-hoshin': 'Anastasia Hoshin',
      'julius-juukulius': 'Julius Juukulius',
      'reinhard-van-astrea': 'Reinhard van Astrea',
      'satella': 'Satella',
      'theresia-van-astrea': 'Theresia van Astrea',
      'wilhelm-van-astrea': 'Wilhelm van Astrea',
      'otto-suwen': 'Otto Suwen',
      'garfiel-tinsel': 'Garfiel Tinsel',
      'frederica-baumann': 'Frederica Baumann',
      'petra-leyte': 'Petra Leyte',
      'shaula': 'Shaula',
      'carmilla': 'Carmilla (Re:Zero)',
      'minerva': 'Minerva (Re:Zero)',
      'daphne': 'Daphne (Re:Zero)',
      'typhon': 'Typhon (Re:Zero)',
      'sekhmet': 'Sekhmet (Re:Zero)',
      'pandora': 'Pandora (Re:Zero)',
      'hector': 'Hector (Re:Zero)',
      'petelgeuse-romanee-conti': 'Petelgeuse Romanee-Conti',
      'regulus-corneas': 'Regulus Corneas',
      'capella-emerada-lugnica': 'Capella Emerada Lugnica',
      'sirius-romanee-conti': 'Sirius Romanee-Conti',
      'lye-batenkaitos': 'Lye Batenkaitos',
      'roy-alphard': 'Roy Alphard',
      'louis-arneb': 'Louis Arneb',
      'elsa-granhiert': 'Elsa Granhiert',
      'meili-portroute': 'Meili Portroute',
      'aldebaran': 'Aldebaran (Re:Zero)',
      'mimi-pearlbaton': 'Mimi Pearlbaton',
    };
    return zerochanMap[normalizedId] || `${characterNameEn} (Re:Zero)`;
  }

  // Safebooru format
  const safebooruMap: Record<string, string> = {
    'rem': 'rem_(re:zero)',
    'ram': 'ram_(re:zero)',
    'emilia': 'emilia_(re:zero)',
    'natsuki-subaru': 'natsuki_subaru',
    'beatrice': 'beatrice_(re:zero)',
    'echidna': 'echidna_(re:zero)',
    'felt': 'felt_(re:zero)',
    'crusch-karsten': 'crusch_karsten',
    'felix-argyle': 'felix_argyle',
    'priscilla-barielle': 'priscilla_barielle',
    'anastasia-hoshin': 'anastasia_hoshin',
    'julius-juukulius': 'julius_juukulius',
    'reinhard-van-astrea': 'reinhard_van_astrea',
    'satella': 'satella_(re:zero)',
    'theresia-van-astrea': 'theresia_van_astrea',
    'wilhelm-van-astrea': 'wilhelm_van_astrea',
    'otto-suwen': 'otto_suwen',
    'garfiel-tinsel': 'garfiel_tinsel',
    'frederica-baumann': 'frederica_baumann',
    'petra-leyte': 'petra_leyte',
    'shaula': 'shaula_(re:zero)',
    'carmilla': 'carmilla_(re:zero)',
    'minerva': 'minerva_(re:zero)',
    'daphne': 'daphne_(re:zero)',
    'typhon': 'typhon_(re:zero)',
    'sekhmet': 'sekhmet_(re:zero)',
    'pandora': 'pandora_(re:zero)',
    'hector': 'hector_(re:zero)',
    'petelgeuse-romanee-conti': 'petelgeuse_romanee-conti',
    'regulus-corneas': 'regulus_corneas',
    'capella-emerada-lugnica': 'capella_emerada_lugnica',
    'sirius-romanee-conti': 'sirius_romanee-conti',
    'lye-batenkaitos': 'lye_batenkaitos',
    'roy-alphard': 'roy_alphard',
    'louis-arneb': 'louis_arneb',
    'elsa-granhiert': 'elsa_granhiert',
    'meili-portroute': 'meili_portroute',
    'aldebaran': 'aldebaran_(re:zero)',
    'mimi-pearlbaton': 'mimi_pearlbaton',
  };

  return safebooruMap[normalizedId] || (characterId ? `${characterId.replace(/-/g, '_')}_(re:zero)` : 'rem_(re:zero)');
}

/**
 * Builds clean, collision-free query strings for Booru & Zerochan engines
 */
export function buildSafeBooruQuery(
  characterId: string,
  tags: string[],
  provider: BooruProvider = 'safebooru'
): DisambiguatedQuery {
  if (provider === 'zerochan') {
    const cleanTag = getCleanCharacterTag(characterId, tags[0] || characterId, 'zerochan');
    return {
      endpoint: 'zerochan',
      formattedQuery: cleanTag,
      antiBanDelayMs: 1200,
    };
  }

  if (provider === 'eshuushuu') {
    const cleanTag = getCleanCharacterTag(characterId, tags[0] || characterId, 'eshuushuu');
    return {
      endpoint: 'eshuushuu',
      formattedQuery: cleanTag,
      antiBanDelayMs: 1200,
    };
  }

  // Safebooru default disambiguation
  const disambiguationAdditions: Record<string, string[]> = {
    'aldebaran': ['helmet'],
    'rem': ['-ram_(re:zero)'],
    'ram': ['-rem_(re:zero)'],
    'felt': ['blonde_hair'],
    'puck': ['cat'],
    'daphne': ['blindfold'],
    'sirius-romanee-conti': ['bandages'],
    'echidna': ['-fox'],
    'scarfdona': ['echidna_(fox)'],
  };

  const cleanCharTag = getCleanCharacterTag(characterId, characterId, 'safebooru');
  const baseTags = tags.length > 0 ? tags : [cleanCharTag];
  const extraTags = disambiguationAdditions[characterId] || [];
  const mergedTags = Array.from(new Set([...baseTags, ...extraTags]));

  // Ensure rating:safe is included for safety
  if (!mergedTags.includes('rating:safe')) {
    mergedTags.push('rating:safe');
  }

  return {
    endpoint: 'safebooru',
    formattedQuery: mergedTags.join(' '),
    antiBanDelayMs: 1200,
  };
}
