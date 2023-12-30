import { type Room } from "@prisma/client";
import { z } from "zod";

export type WaitListEntry = z.infer<typeof waitListEntryParser>;

export const waitListEntryParser = z.object({
  name: z.string(),
  time: z.date(),
});

export const waitListParser = z.array(waitListEntryParser);

export const getWaitList = (
  room: Room | null,
): { name: string; time: Date }[] => {
  return waitListParser.parse(
    (JSON.parse(room?.waitList ?? "[]") as unknown[]).map((x) => ({
      ...x,
      time: new Date(x.time),
    })),
  );
};

export const isPerson = (name: string) => (entry: WaitListEntry) =>
  entry.name === name;

export const isNotPerson = (name: string) => (entry: WaitListEntry) =>
  entry.name !== name;
