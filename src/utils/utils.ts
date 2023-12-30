import { type Room } from "@prisma/client";
import { z } from "zod";

export type WaitListEntry = z.infer<typeof waitListEntryParser>;

const waitListRawParser = z.array(
  z.object({
    name: z.string(),
    time: z.string(),
  }),
);

export const waitListEntryParser = z.object({
  name: z.string(),
  time: z.date(),
});

export const waitListParser = z.array(waitListEntryParser);

export const getWaitList = (
  room: Room | null,
): { name: string; time: Date }[] => {
  return waitListRawParser
    .parse(JSON.parse(room?.waitList ?? "[]"))
    .map((x) => ({
      ...x,
      time: new Date(x.time),
    }));
};

export const isPerson = (name: string) => (entry: WaitListEntry) =>
  entry.name === name;

export const isNotPerson = (name: string) => (entry: WaitListEntry) =>
  entry.name !== name;
