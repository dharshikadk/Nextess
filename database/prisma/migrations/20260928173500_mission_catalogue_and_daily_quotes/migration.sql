UPDATE "Subject" SET "displayName" = 'Physical & Synthetic Chemistry' WHERE "key" = 'CHEMISTRY';
UPDATE "Subject" SET "displayName" = 'Evolutionary Biology' WHERE "key" = 'BIOLOGY';
DELETE FROM "DailyQuote" WHERE "dateKey" LIKE '2099-01-%';

INSERT INTO "DailyQuote" ("id","dateKey","quote","source","category") VALUES
(gen_random_uuid(),'2000-01-01','The important thing is not to stop questioning.','Albert Einstein','science'),
(gen_random_uuid(),'2000-01-02','The important thing is to know what is important.','Albert Einstein','science'),
(gen_random_uuid(),'2000-01-03','If I have seen further it is by standing on the shoulders of giants.','Isaac Newton','science'),
(gen_random_uuid(),'2000-01-04','To myself I seem to have been only like a boy playing on the seashore.','Isaac Newton','science'),
(gen_random_uuid(),'2000-01-05','Nothing in life is to be feared, it is only to be understood.','Marie Curie','science'),
(gen_random_uuid(),'2000-01-06','Humanity needs practical men, but humanity also needs dreamers.','Marie Curie','science'),
(gen_random_uuid(),'2000-01-07','Diligence is the mother of good luck.','Benjamin Franklin','finance'),
(gen_random_uuid(),'2000-01-08','Drive thy business; let not thy business drive thee.','Benjamin Franklin','finance'),
(gen_random_uuid(),'2000-01-09','Remember that time is money.','Benjamin Franklin','finance'),
(gen_random_uuid(),'2000-01-10','One today is worth two tomorrows.','Benjamin Franklin','finance'),
(gen_random_uuid(),'2000-01-11','Keep thy shop, and thy shop will keep thee.','Benjamin Franklin','finance'),
(gen_random_uuid(),'2000-01-12','God helps them that help themselves.','Benjamin Franklin','success'),
(gen_random_uuid(),'2000-01-13','The harder the conflict, the more glorious the triumph.','Thomas Paine','success'),
(gen_random_uuid(),'2000-01-14','What we obtain too cheap, we esteem too lightly.','Thomas Paine','success'),
(gen_random_uuid(),'2000-01-15','Society is produced by our wants, and government by our wickedness.','Thomas Paine','economics'),
(gen_random_uuid(),'2000-01-16','The beginning is thought to be more than half the whole.','Aristotle','success'),
(gen_random_uuid(),'2000-01-17','The mistake lies in the beginning.','Aristotle','success'),
(gen_random_uuid(),'2000-01-18','Well begun is half done.','Aristotle','success'),
(gen_random_uuid(),'2000-01-19','Knowledge is power.','Francis Bacon','science'),
(gen_random_uuid(),'2000-01-20','Reading maketh a full man; conference a ready man; and writing an exact man.','Francis Bacon','learning'),
(gen_random_uuid(),'2000-01-21','Nature, to be commanded, must be obeyed.','Francis Bacon','science'),
(gen_random_uuid(),'2000-01-22','The die is cast.','Julius Caesar','success'),
(gen_random_uuid(),'2000-01-23','Fortune favors the bold.','Virgil','success'),
(gen_random_uuid(),'2000-01-24','The greatest wealth is to live content with little.','Plato','finance'),
(gen_random_uuid(),'2000-01-25','He who learns but does not think, is lost.','Confucius','learning'),
(gen_random_uuid(),'2000-01-26','I hear and I forget. I see and I remember. I do and I understand.','Confucius','learning'),
(gen_random_uuid(),'2000-01-27','It does not matter how slowly you go as long as you do not stop.','Confucius','success'),
(gen_random_uuid(),'2000-01-28','The journey of a thousand miles begins with one step.','Lao Tzu','success'),
(gen_random_uuid(),'2000-01-29','A person who never made a mistake never tried anything new.','Albert Einstein','success'),
(gen_random_uuid(),'2000-01-30','An ounce of prevention is worth a pound of cure.','Benjamin Franklin','success')
ON CONFLICT ("dateKey") DO UPDATE SET "quote"=EXCLUDED."quote","source"=EXCLUDED."source","category"=EXCLUDED."category";