/*
  Warnings:

  - You are about to drop the column `order` on the `CustomSizeSet` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomSizeSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerVariant" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imagePosition" TEXT NOT NULL DEFAULT 'top',
    "imageWidth" TEXT DEFAULT 'auto',
    "imageHeight" TEXT DEFAULT 'auto',
    "imageContainerWidth" TEXT DEFAULT 'auto',
    "fieldsContainerWidth" TEXT DEFAULT 'auto',
    "mobileImagePosition" TEXT NOT NULL DEFAULT 'top',
    "mobileImageWidth" TEXT DEFAULT 'auto',
    "mobileImageHeight" TEXT DEFAULT 'auto',
    "mobileImageContainerWidth" TEXT DEFAULT 'auto',
    "mobileFieldsContainerWidth" TEXT DEFAULT 'auto',
    "displayStyle" TEXT NOT NULL DEFAULT 'MODAL',
    "noteTitle" TEXT,
    "noteContent" TEXT,
    "reqNearestSize" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CustomSizeSet" ("createdAt", "displayStyle", "fieldsContainerWidth", "id", "imageContainerWidth", "imageHeight", "imagePosition", "imageUrl", "imageWidth", "name", "noteContent", "noteTitle", "reqNearestSize", "shop", "triggerVariant", "updatedAt") SELECT "createdAt", "displayStyle", "fieldsContainerWidth", "id", "imageContainerWidth", "imageHeight", "imagePosition", "imageUrl", "imageWidth", "name", "noteContent", "noteTitle", "reqNearestSize", "shop", "triggerVariant", "updatedAt" FROM "CustomSizeSet";
DROP TABLE "CustomSizeSet";
ALTER TABLE "new_CustomSizeSet" RENAME TO "CustomSizeSet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
