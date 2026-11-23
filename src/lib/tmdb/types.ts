export type TmdbGenre = { id: number; name: string };

export type TmdbTitleListItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
  original_language?: string;
  genre_ids?: number[];
};

export type TmdbMovieDetail = TmdbTitleListItem & {
  belongs_to_collection?: { id: number; name: string } | null;
  tagline?: string;
  runtime?: number | null;
  status?: string;
  genres?: TmdbGenre[];
  credits?: TmdbCredits;
  keywords?: { keywords?: { id: number; name: string }[] };
};

export type TmdbTvDetail = TmdbTitleListItem & {
  tagline?: string;
  episode_run_time?: number[];
  status?: string;
  genres?: TmdbGenre[];
  credits?: TmdbCredits;
  aggregate_credits?: TmdbCredits;
  keywords?: { results?: { id: number; name: string }[] };
  seasons?: TmdbSeason[];
  next_episode_to_air?: TmdbEpisode | null;
};

export type TmdbCredits = {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
};

export type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  known_for_department?: string;
  order?: number;
};

export type TmdbCrewMember = {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path: string | null;
  known_for_department?: string;
};

export type TmdbSeason = {
  id: number;
  name: string;
  overview?: string;
  air_date?: string | null;
  episode_count?: number;
  poster_path: string | null;
  season_number: number;
};

export type TmdbEpisode = {
  id: number;
  name: string;
  overview?: string;
  air_date?: string | null;
  episode_number: number;
  season_number?: number;
  runtime?: number | null;
  still_path: string | null;
};

export type TmdbCollection = {
  id: number;
  name: string;
  parts: TmdbTitleListItem[];
};

export type TmdbPerson = {
  id: number;
  name: string;
  biography?: string;
  profile_path: string | null;
  known_for_department?: string;
  birthday?: string | null;
  deathday?: string | null;
};

export type TmdbPaged<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};
