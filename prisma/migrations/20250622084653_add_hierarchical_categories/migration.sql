-- CreateTable
CREATE TABLE "MajorCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MinorCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "major_category_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MinorCategory_major_category_id_fkey" FOREIGN KEY ("major_category_id") REFERENCES "MajorCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreHierarchicalCategoryMapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "store_name" TEXT NOT NULL,
    "major_category_id" INTEGER NOT NULL,
    "minor_category_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "StoreHierarchicalCategoryMapping_major_category_id_fkey" FOREIGN KEY ("major_category_id") REFERENCES "MajorCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StoreHierarchicalCategoryMapping_minor_category_id_fkey" FOREIGN KEY ("minor_category_id") REFERENCES "MinorCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MajorCategory_name_key" ON "MajorCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MinorCategory_major_category_id_name_key" ON "MinorCategory"("major_category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StoreHierarchicalCategoryMapping_store_name_key" ON "StoreHierarchicalCategoryMapping"("store_name");
