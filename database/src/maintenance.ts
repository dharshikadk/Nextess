import { PrismaClient, RewardType } from "@prisma/client";

const prisma=new PrismaClient();

async function reconcileRewards() {
  const users=await prisma.user.findMany({select:{id:true,username:true,xp:true,coins:true}});
  const ledger=await prisma.rewardLedger.groupBy({by:["userId","rewardType"],_sum:{amount:true}});
  const totals=new Map<string,{xp:number;coins:number}>();
  for(const row of ledger){
    const current=totals.get(row.userId)||{xp:0,coins:0};
    current[row.rewardType===RewardType.XP?"xp":"coins"]+=Number(row._sum.amount||0);
    totals.set(row.userId,current);
  }
  const mismatches=users.map(user=>{
    const expected=totals.get(user.id)||{xp:0,coins:0};
    return {username:user.username,userId:user.id,stored:{xp:user.xp,coins:user.coins},ledger:expected};
  }).filter(row=>row.stored.xp!==row.ledger.xp||row.stored.coins!==row.ledger.coins);
  if(mismatches.length){
    console.error(JSON.stringify({ok:false,mismatches},null,2));
    throw new Error(`Reward reconciliation failed for ${mismatches.length} user(s).`);
  }
  console.log(JSON.stringify({ok:true,users:users.length},null,2));
}

async function cleanupAnonymousSessions() {
  const now=new Date();
  const expired=await prisma.anonymousSession.findMany({where:{expiresAt:{lt:now}},select:{id:true}});
  if(!expired.length){console.log(JSON.stringify({ok:true,deletedSessions:0}));return;}
  const result=await prisma.anonymousSession.deleteMany({where:{id:{in:expired.map(row=>row.id)}}});
  console.log(JSON.stringify({ok:true,deletedSessions:result.count}));
}

const command=process.argv[2];
(async()=>{
  if(command==="reconcile-rewards") await reconcileRewards();
  else if(command==="cleanup-anonymous") await cleanupAnonymousSessions();
  else throw new Error("Usage: tsx src/maintenance.ts reconcile-rewards | cleanup-anonymous");
})().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1}).finally(()=>prisma.$disconnect());
