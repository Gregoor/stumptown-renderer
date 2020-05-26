import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import DocumentForm, { DocumentData } from "./index";

export default function DocumentCreate() {
  const { locale, "*": slug } = useParams();
  const navigate = useNavigate();
  const [savingError, setSavingError] = useState<Error | null>(null);

  async function handleCreate(data: DocumentData) {
    try {
      const response = await fetch(`/_document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, ...data }),
      });
      if (!response.ok) {
        setSavingError(
          new Error(`${response.status}: ${await response.text()}`)
        );
        return;
      }
      navigate(`/${locale}/docs/${data.meta.slug}`, { replace: true });
    } catch (err) {
      setSavingError(err);
    }
  }

  useEffect(() => {
    // remove slug from URL, as it might be changed in the form
    navigate(`/${locale}/_create`);
  }, [locale, navigate]);

  return (
    <DocumentForm
      isNew
      data={{ meta: { slug } }}
      onSave={handleCreate}
      savingError={savingError}
    />
  );
}
