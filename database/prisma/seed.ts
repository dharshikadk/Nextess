import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { importMissionPackage } from "../src/mission-importer.js";

const prisma = new PrismaClient();
const sourcePath = path.resolve(__dirname, "../content/nextess_missions(4).json");

async function main() {
  const pkg = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const imported = await importMissionPackage(prisma, pkg, "publish");
  const badges = [
    ["streak-7","7 Day Streak","Maintain a qualifying learning streak for 7 days.","STREAK"],
    ["streak-14","14 Day Streak","Maintain a qualifying learning streak for 14 days.","STREAK"],
    ["perfect-mission","Perfect Level","Complete a mission level without an incorrect answer.","PERFECT"],
    ["mission-complete","Mission Complete","Complete a Nextess mission.","MISSION"]
  ] as const;
  for (const [key,name,description,kind] of badges) {
    await prisma.badge.upsert({where:{key},update:{name,description,kind,criteria:{key}},create:{key,name,description,kind,criteria:{key}}});
  }

  const directives = [
    ["00000000-0000-0000-0000-000000000001","Complete one investigation","Finish one mission investigation today.",60,10,0],
    ["00000000-0000-0000-0000-000000000002","Review one concept","Use a saved report or completed level for review.",40,5,1],
    ["00000000-0000-0000-0000-000000000003","Run one simulation","Change a variable and record the observed consequence.",30,10,2]
  ] as const;
  for (const [id,title,description,rewardXp,rewardCoins,ordering] of directives) {
    await prisma.dailyDirective.upsert({where:{id},update:{title,description,rewardXp,rewardCoins,ordering,active:true},create:{id,title,description,rewardXp,rewardCoins,ordering,active:true}});
  }

  const quotes = [
    ["The important thing is not to stop questioning.","Albert Einstein","science"],
    ["The important thing is to know what is important.","Albert Einstein","science"],
    ["If I have seen further it is by standing on the shoulders of giants.","Isaac Newton","science"],
    ["To myself I seem to have been only like a boy playing on the seashore.","Isaac Newton","science"],
    ["Nothing in life is to be feared, it is only to be understood.","Marie Curie","science"],
    ["Humanity needs practical men, but humanity also needs dreamers.","Marie Curie","science"],
    ["Diligence is the mother of good luck.","Benjamin Franklin","finance"],
    ["Drive thy business; let not thy business drive thee.","Benjamin Franklin","finance"],
    ["Remember that time is money.","Benjamin Franklin","finance"],
    ["One today is worth two tomorrows.","Benjamin Franklin","finance"],
    ["Keep thy shop, and thy shop will keep thee.","Benjamin Franklin","finance"],
    ["God helps them that help themselves.","Benjamin Franklin","success"],
    ["The harder the conflict, the more glorious the triumph.","Thomas Paine","success"],
    ["What we obtain too cheap, we esteem too lightly.","Thomas Paine","success"],
    ["Society is produced by our wants, and government by our wickedness.","Thomas Paine","economics"],
    ["The beginning is thought to be more than half the whole.","Aristotle","success"],
    ["The mistake lies in the beginning.","Aristotle","success"],
    ["Well begun is half done.","Aristotle","success"],
    ["Knowledge is power.","Francis Bacon","science"],
    ["Reading maketh a full man; conference a ready man; and writing an exact man.","Francis Bacon","learning"],
    ["Nature, to be commanded, must be obeyed.","Francis Bacon","science"],
    ["The die is cast.","Julius Caesar","success"],
    ["Fortune favors the bold.","Virgil","success"],
    ["The greatest wealth is to live content with little.","Plato","finance"],
    ["He who learns but does not think, is lost.","Confucius","learning"],
    ["I hear and I forget. I see and I remember. I do and I understand.","Confucius","learning"],
    ["It does not matter how slowly you go as long as you do not stop.","Confucius","success"],
    ["The journey of a thousand miles begins with one step.","Lao Tzu","success"],
    ["A person who never made a mistake never tried anything new.","Albert Einstein","success"],
    ["The best way to have a good idea is to have a lot of ideas.","Linus Pauling","chemistry"]
  ] as const;
  await prisma.dailyQuote.deleteMany({});
  for (const [index,[quote,source,category]] of quotes.entries()) {
    const dateKey=`2000-01-${String(index+1).padStart(2,"0")}`;
    await prisma.dailyQuote.create({data:{dateKey,quote,source,category}});
  }
  console.log(`Imported ${imported.length} mission versions with immutable published-version checks.`);
}

main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
