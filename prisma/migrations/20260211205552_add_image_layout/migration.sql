-- AlterTable
ALTER TABLE "CustomSizeField" ADD COLUMN "placeholder" TEXT;

-- CreateTable
CREATE TABLE "CustomSizeDesign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "imageLayout" TEXT DEFAULT 'vertical',
    "modalBgColor" TEXT,
    "borderWidth" INTEGER,
    "borderStyle" TEXT,
    "borderColor" TEXT,
    "textColor" TEXT,
    "placeholderColor" TEXT,
    "titleColor" TEXT,
    "noteColor" TEXT,
    "noteBgColor" TEXT,
    "customCss" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomSizeSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerVariant" TEXT NOT NULL,
    "imageUrl" TEXT,
    "displayStyle" TEXT NOT NULL DEFAULT 'MODAL',
    "noteTitle" TEXT,
    "noteContent" TEXT,
    "reqNearestSize" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CustomSizeSet" ("createdAt", "id", "imageUrl", "name", "shop", "triggerVariant", "updatedAt") SELECT "createdAt", "id", "imageUrl", "name", "shop", "triggerVariant", "updatedAt" FROM "CustomSizeSet";
DROP TABLE "CustomSizeSet";
ALTER TABLE "new_CustomSizeSet" RENAME TO "CustomSizeSet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CustomSizeDesign_shop_key" ON "CustomSizeDesign"("shop");
