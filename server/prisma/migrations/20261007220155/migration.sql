-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('ROCK', 'HIP_HOP', 'RNB', 'LOFI', 'POP', 'JAZZ', 'ELECTRONIC', 'OTHER');

-- CreateEnum
CREATE TYPE "StemType" AS ENUM ('VOCALS', 'DRUMS', 'BASS', 'GUITAR', 'PIANO', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "genre" "Genre",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sonofile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "genre" "Genre" NOT NULL,
    "loopStart" DOUBLE PRECISION NOT NULL,
    "loopEnd" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "loopStems" "StemType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sonofile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stem" (
    "id" TEXT NOT NULL,
    "sonofileId" TEXT NOT NULL,
    "vocals" TEXT NOT NULL,
    "drums" TEXT NOT NULL,
    "bass" TEXT NOT NULL,
    "guitar" TEXT NOT NULL,
    "piano" TEXT NOT NULL,
    "other" TEXT NOT NULL,

    CONSTRAINT "Stem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Sonofile_userId_idx" ON "Sonofile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Stem_sonofileId_key" ON "Stem"("sonofileId");

-- AddForeignKey
ALTER TABLE "Sonofile" ADD CONSTRAINT "Sonofile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stem" ADD CONSTRAINT "Stem_sonofileId_fkey" FOREIGN KEY ("sonofileId") REFERENCES "Sonofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
