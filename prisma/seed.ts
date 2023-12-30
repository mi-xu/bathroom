/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { db } from "../src/server/db";

async function main() {
  await db.room.deleteMany({});
  await db.room.create({
    data: {
      id: 0,
      name: "Front",
    },
  });
  await db.room.create({
    data: {
      id: 1,
      name: "Back",
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
