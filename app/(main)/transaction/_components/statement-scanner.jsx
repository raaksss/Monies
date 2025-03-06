"use client";

import { useRef, useEffect} from "react";
import { Camera, Loader2, ReceiptIndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { importStatementTransactions} from "@/actions/transaction";

export function StatementScanner({onStatementImport }) {
  const statementInputRef = useRef(null);

  const {
    loading: importStatementLoading,
    fn: importStatementFn,
    data: importedStatement,
  } = useFetch(importStatementTransactions);


  const handleFileUpload = async (file,type) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
      await importStatementFn(file);
  
  };

  useEffect(() => {
    if (importedStatement && !importStatementLoading) {
      console.log("Imported Transactions:", importedStatement);
      onStatementImport(importedStatement);
      toast.success("Bank statement imported successfully!");
    }
  }, [importStatementLoading, importedStatement]);

  return (
    <div className="w-full flex items-center">
     {/* Bank Statement Import */}
     <input
        type="file"
        ref={statementInputRef}
        className="hidden"
        accept=".pdf,.csv,.xls,.xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "statement"); 
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => statementInputRef.current?.click()}
        disabled={importStatementLoading}
      >
        {importStatementLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Importing Statement...</span>
          </>
        ) : (
          <>
            <ReceiptIndianRupee className="mr-2" />
            <span>Import Monthly Statement</span>
          </>
        )}
      </Button>
    </div>
  );
}