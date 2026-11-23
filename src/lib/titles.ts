import { TitleType, WatchStatus } from "@prisma/client";
import { yearFromDate } from "@/lib/utils";

export type TitleCardModel = {
  id: string;
  title: string;
  type: TitleType;
  year: number | null;
  releaseDate: Date | null;
  posterPath: string | null;
  voteAverage: number;
  genres: string[];
  watchStatus: WatchStatus | null;
  isFavorite: boolean;
  userRating: number | null;
};

export function toTitleCard(
  title: {
    id: string;
    title: string;
    type: TitleType;
    releaseDate: Date | null;
    posterPath: string | null;
    voteAverage: number;
    genres?: { genre: { name: string } }[];
  },
  extras?: {
    watchStatus?: WatchStatus | null;
    isFavorite?: boolean;
    userRating?: number | null;
  },
): TitleCardModel {
  return {
    id: title.id,
    title: title.title,
    type: title.type,
    year: yearFromDate(title.releaseDate),
    releaseDate: title.releaseDate,
    posterPath: title.posterPath,
    voteAverage: title.voteAverage,
    genres: (title.genres ?? []).map((item) => item.genre.name).slice(0, 2),
    watchStatus: extras?.watchStatus ?? null,
    isFavorite: extras?.isFavorite ?? false,
    userRating: extras?.userRating ?? null,
  };
}
