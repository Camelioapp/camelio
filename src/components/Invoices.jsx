import React, { useState } from "react";
import {
  Camera,
  ChevronRight,
  Download,
  FileText,
  ReceiptText,
} from "lucide-react";

import { Field, Popup, SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

function parseMoney(value) {
  return Number(String(value || "0").replace(",", ".")) || 0;
}

function moneyLabel(value, rounded = false) {
  const number = Number(value || 0);
  return `${number.toFixed(rounded ? 0 : 2).replace(".", ",")} $`;
}

function SummaryButton({ label, value }) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-center shadow-sm ring-1 ring-[#EFE4D6]">
      <p className="text-xl font-extrabold text-[#55534C]">{value}</p>
      <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wide text-[#746F64]">
        {label}
      </p>
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 transition ${
        active
          ? "bg-[#F0F3EA] text-[#7A8564] ring-2 ring-[#DDE4D2]"
          : "bg-white text-[#746F64] ring-[#EFE4D6]"
      }`}
    >
      {children}
    </button>
  );
}

function ReceiptSection({ title, receipts, onDetails }) {
  const [open, setOpen] = useState(title.toLowerCase().includes("rembourser"));

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-lg font-bold text-[#55534C]">{title}</h3>
          <p className="mt-1 text-sm text-[#746F64]">
            {receipts.length} facture{receipts.length > 1 ? "s" : ""}
          </p>
        </div>

        <ChevronRight
          className={`mt-1 h-5 w-5 shrink-0 text-[#A8B193] transition ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {receipts.length ? (
            receipts.map((receipt) => (
              <button
                key={receipt.id}
                type="button"
                onClick={() => onDetails(receipt)}
                className="w-full rounded-2xl bg-[#FFFDF8] p-4 text-left ring-1 ring-[#EFE4D6]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#55534C]">
                      {receipt.title}
                    </p>

                    <p className="mt-1 text-sm text-[#746F64]">
                      {receipt.child} · {receipt.category}
                    </p>

                    {receipt.invoiceDate && (
                      <p className="mt-1 text-xs font-bold text-[#A8B193]">
                        Date : {receipt.invoiceDate}
                      </p>
                    )}

                    {receipt.fileName && (
                      <p className="mt-2 inline-flex max-w-full rounded-full bg-white px-3 py-1 text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
                        <span className="truncate">{receipt.fileName}</span>
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 font-bold text-[#55534C]">
                    {receipt.amount || "0"} $
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucune facture.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReceiptDetails({ receipt, close, onUpdate }) {
  const [draft, setDraft] = useState(receipt);
  const [showPartialPayment, setShowPartialPayment] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    method: "Virement",
    note: "",
  });

  const amount = parseMoney(draft.amount);
  const percent = parseMoney(draft.reimbursementPercent || "50");
  const expected = amount * (percent / 100);
  const expectedAmount = draft.roundReimbursement
    ? Math.round(expected)
    : Math.round(expected * 100) / 100;

  const paidAmount = parseMoney(draft.paidAmount);
  const remainingAmount = Math.max(0, expectedAmount - paidAmount);

  const paymentStatus = !draft.reimbursement
    ? "Aucun remboursement demandé"
    : remainingAmount <= 0 && expectedAmount > 0
      ? "Paiement reçu"
      : paidAmount > 0
        ? "Paiement partiel reçu"
        : "Facture non payée par l'autre parent";

  const saveDraft = (updates) => {
    const updated = {
      ...draft,
      ...updates,
    };

    setDraft(updated);
    onUpdate(updated);
  };

  const addPartialPayment = () => {
    const received = parseMoney(paymentForm.amount);
    if (!received || !paymentForm.date) return;

    const nextPaidAmount = Math.min(expectedAmount, paidAmount + received);

    saveDraft({
      paidAmount: String(nextPaidAmount),
      payments: [
        ...(draft.payments || []),
        {
          amount: received,
          date: paymentForm.date,
          method: paymentForm.method,
          note: paymentForm.note.trim(),
        },
      ],
      status:
        nextPaidAmount >= expectedAmount
          ? "Paiement reçu"
          : "Paiement partiel reçu",
    });

    setPaymentForm({
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      method: "Virement",
      note: "",
    });

    setShowPartialPayment(false);
  };

  const markPaid = () => {
    const today = new Date().toISOString().slice(0, 10);
    const amountToAdd = Math.max(0, expectedAmount - paidAmount);

    saveDraft({
      paidAmount: String(expectedAmount),
      payments: [
        ...(draft.payments || []),
        {
          amount: amountToAdd,
          date: today,
          method: "Paiement reçu",
          note: "Paiement complet",
        },
      ],
      status: "Paiement reçu",
    });
  };

  return (
    <Popup title={draft.title} kicker="Détails de la facture" close={close}>
      <div className="space-y-4">
        {draft.reimbursement && (
          <div
            className={`rounded-2xl p-4 ring-1 ${
              remainingAmount <= 0
                ? "bg-[#F0F3EA] text-[#7A8564] ring-[#DDE4D2]"
                : paidAmount > 0
                  ? "bg-[#F4F8FD] text-[#6A85AF] ring-[#D3DFF1]"
                  : "bg-[#F6F0FF] text-[#B68E3D] ring-[#F1DDAE]"
            }`}
          >
            <p className="text-sm font-bold">{paymentStatus}</p>
          </div>
        )}

        <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
          <p className="label">Montant total</p>
          <p className="mt-1 font-bold text-[#55534C]">
            {moneyLabel(amount)}
          </p>
        </div>

        {draft.reimbursement && (
          <>
            <div className="grid !grid-cols-2 gap-3">
              <Field label="Part autre parent">
                <div className="flex items-center rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3">
                  <input
                    value={draft.reimbursementPercent || ""}
                    onChange={(event) =>
                      saveDraft({
                        reimbursementPercent: event.target.value,
                      })
                    }
                    className="w-full bg-transparent text-sm font-bold text-[#55534C] outline-none"
                    inputMode="decimal"
                  />
                  <span className="ml-2 text-xs font-bold text-[#A8B193]">
                    %
                  </span>
                </div>
              </Field>

              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Arrondi</p>
                <div className="mt-2">
                  <ToggleButton
                    active={Boolean(draft.roundReimbursement)}
                    onClick={() =>
                      saveDraft({
                        roundReimbursement: !draft.roundReimbursement,
                      })
                    }
                  >
                    {draft.roundReimbursement ? "Oui" : "Non"}
                  </ToggleButton>
                </div>
              </div>
            </div>

            <div className="grid !grid-cols-1 gap-3">
              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Montant à rembourser</p>
                <p className="mt-1 font-bold text-[#55534C]">
                  {moneyLabel(expectedAmount, draft.roundReimbursement)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Paiement reçu</p>
                <p className="mt-1 font-bold text-[#55534C]">
                  {moneyLabel(paidAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Solde restant</p>
                <p className="mt-1 font-bold text-[#55534C]">
                  {moneyLabel(remainingAmount)}
                </p>
              </div>
            </div>

            <div className="grid !grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowPartialPayment((current) => !current)}
                className="rounded-2xl bg-[#F4F8FD] px-4 py-3 text-sm font-bold text-[#6A85AF] ring-1 ring-[#D3DFF1]"
              >
                Paiement partiel
              </button>

              <button
                type="button"
                onClick={markPaid}
                className="rounded-2xl bg-[#A8B193] px-4 py-3 text-sm font-bold text-white"
              >
                Paiement reçu
              </button>
            </div>

            {showPartialPayment && (
  <div className="rounded-2xl bg-[#F8F3EA] p-4 ring-1 ring-[#EFE4D6]">
    <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
      <Field label="Montant reçu">
        <input
          className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-white px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
          value={paymentForm.amount}
          onChange={(event) =>
            setPaymentForm({
              ...paymentForm,
              amount: event.target.value,
            })
          }
          placeholder="Ex. 10,00"
          inputMode="decimal"
        />
      </Field>

      <Field label="Date">
        <input
          type="date"
          className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-white px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
          value={paymentForm.date}
          onChange={(event) =>
            setPaymentForm({
              ...paymentForm,
              date: event.target.value,
            })
          }
        />
      </Field>
    </div>

    <div className="mt-4">
      <Field label="Mode de paiement">
        <select
          className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-white px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
          value={paymentForm.method}
          onChange={(event) =>
            setPaymentForm({
              ...paymentForm,
              method: event.target.value,
            })
          }
        >
          {[
            "Virement",
            "Interac",
            "Comptant",
            "Chèque",
            "Carte",
            "Déduction d'achat",
            "Autre",
          ].map((method) => (
            <option key={method}>{method}</option>
          ))}
        </select>
      </Field>
    </div>

    <div className="mt-4">
      <Field label="Note">
        <textarea
          className="mt-2 min-h-[95px] w-full resize-none rounded-2xl border border-[#EFE4D6] bg-white px-4 py-3 text-sm leading-6 text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
          value={paymentForm.note}
          onChange={(event) =>
            setPaymentForm({
              ...paymentForm,
              note: event.target.value,
            })
          }
          placeholder="Ex. Déduction d’achat, remboursement partiel..."
        />
      </Field>
    </div>

    <button
      type="button"
      onClick={addPartialPayment}
      className="mt-4 w-full rounded-2xl bg-[#55534C] px-4 py-3 text-sm font-bold text-white"
    >
      Enregistrer le paiement
    </button>
  </div>
)}

            {!!draft.payments?.length && (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Historique des paiements</p>

                <div className="mt-3 space-y-2">
                  {draft.payments.map((payment, index) => (
                    <div
                      key={`${payment.date}-${index}`}
                      className="rounded-xl bg-[#FFFDF8] px-3 py-2 text-sm ring-1 ring-[#EFE4D6]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#746F64]">{payment.date}</span>
                        <strong className="text-[#55534C]">
                          {moneyLabel(payment.amount)}
                        </strong>
                      </div>

                      <p className="mt-1 text-xs font-bold text-[#746F64]">
                        {payment.method || "Mode non précisé"}
                      </p>

                      {payment.note && (
                        <p className="mt-1 text-xs text-[#746F64]">
                          {payment.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#EFE4D6]">
          <button
            type="button"
            onClick={() => setShowAdditionalInfo((current) => !current)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-sm font-bold text-[#55534C]">
                Informations supplémentaires
              </p>
              <p className="mt-1 text-xs text-[#746F64]">
                Enfant, catégorie, impôts et preuve.
              </p>
            </div>

            <ChevronRight
              className={`h-5 w-5 text-[#A8B193] transition ${
                showAdditionalInfo ? "rotate-90" : ""
              }`}
            />
          </button>

          {showAdditionalInfo && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Enfant</p>
                <p className="mt-1 font-bold text-[#55534C]">{draft.child}</p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Catégorie</p>
                <p className="mt-1 font-bold text-[#55534C]">
                  {draft.category}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Impôts</p>
                <p className="mt-1 font-bold text-[#55534C]">
                  {draft.tax ? "Oui" : "Non"}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                <p className="label">Date de facture</p>
                <p className="mt-1 font-bold text-[#55534C]">
                  {draft.invoiceDate || "Non précisée"}
                </p>
              </div>

              {draft.fileName && (
                <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
                  <p className="label">Preuve</p>
                  <p className="mt-1 truncate font-bold text-[#55534C]">
                    {draft.fileName}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={close}
          className="w-full rounded-2xl bg-[#D9C9F2] px-4 py-3 text-sm font-bold text-white"
        >
          Fermer
        </button>
      </div>
    </Popup>
  );
}

export default function Receipts({ children = [] }) {
  const [receipts, setReceipts] = useState([
    {
      id: "receipt-1",
      title: "Pharmacie",
      amount: "24,95",
      invoiceDate: "2026-05-16",
      child: "Mia",
      category: "Santé",
      tax: true,
      reimbursement: true,
      reimbursementPercent: "50",
      roundReimbursement: false,
      paidAmount: "0",
      payments: [],
      status: "À rembourser",
      fileName: "",
      fileUrl: "",
    },
    {
      id: "receipt-2",
      title: "Matériel scolaire",
      amount: "42,30",
      invoiceDate: "2026-05-15",
      child: "Léo",
      category: "École",
      tax: false,
      reimbursement: true,
      reimbursementPercent: "50",
      roundReimbursement: false,
      paidAmount: "0",
      payments: [],
      status: "À rembourser",
      fileName: "",
      fileUrl: "",
    },
  ]);

  const [showReceiptPopup, setShowReceiptPopup] = useState(false);
  const [details, setDetails] = useState(null);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showOtherParentInfo, setShowOtherParentInfo] = useState(false);
  const [showStatement, setShowStatement] = useState(false);

  const [otherParent, setOtherParent] = useState({
    name: "",
    sharePercent: "50",
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    child: "Général",
    category: "Santé",
    tax: false,
    reimbursement: false,
    reimbursementPercent: "50",
    roundReimbursement: false,
    fileName: "",
    fileUrl: "",
  });

  const [exportOptions, setExportOptions] = useState({
    exportType: "grid",
    child: "Tous les enfants",
    taxesOnly: false,
    startDate: "",
    endDate: "",
    includeDocuments: false,
  });

  const taxReceipts = receipts.filter((receipt) => receipt.tax);
  const reimbursementReceipts = receipts.filter((receipt) => receipt.reimbursement);

  const formAmount = parseMoney(form.amount);
  const formPercent = parseMoney(form.reimbursementPercent);
  const expectedReimbursement = formAmount * (formPercent / 100);
  const displayedReimbursement = form.roundReimbursement
    ? Math.round(expectedReimbursement)
    : Math.round(expectedReimbursement * 100) / 100;

  const calculateExpected = (receipt) => {
    const amount = parseMoney(receipt.amount);
    const percent = parseMoney(receipt.reimbursementPercent || "50");
    const expected = amount * (percent / 100);

    return receipt.roundReimbursement
      ? Math.round(expected)
      : Math.round(expected * 100) / 100;
  };

  const statementTotal = reimbursementReceipts.reduce(
    (sum, receipt) => sum + calculateExpected(receipt),
    0
  );

  const statementPaid = reimbursementReceipts.reduce(
    (sum, receipt) => sum + parseMoney(receipt.paidAmount),
    0
  );

  const statementRemaining = Math.max(0, statementTotal - statementPaid);

  const expensesByChild = children
    .map((child) => {
      const childReceipts = reimbursementReceipts.filter(
        (receipt) => receipt.child === child.name
      );

      return {
        child,
        receipts: childReceipts,
        total: childReceipts.reduce(
          (sum, receipt) => sum + parseMoney(receipt.amount),
          0
        ),
        expected: childReceipts.reduce(
          (sum, receipt) => sum + calculateExpected(receipt),
          0
        ),
      };
    })
    .filter((entry) => entry.receipts.length > 0);

  const generalReimbursementReceipts = reimbursementReceipts.filter(
    (receipt) => receipt.child === "Général"
  );

  const addReceipt = () => {
    const title = form.title.trim();
    if (!title) return;

    setReceipts((current) => [
      {
        ...form,
        id: `receipt-${Date.now()}`,
        title,
        amount: form.amount.trim(),
        paidAmount: "0",
        payments: [],
        status: form.reimbursement ? "À rembourser" : "Payé",
      },
      ...current,
    ]);

    setForm({
      title: "",
      amount: "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      child: "Général",
      category: "Santé",
      tax: false,
      reimbursement: false,
      reimbursementPercent: "50",
      roundReimbursement: false,
      fileName: "",
      fileUrl: "",
    });

    setShowReceiptPopup(false);
  };

  const updateReceipt = (updatedReceipt) => {
    setReceipts((current) =>
      current.map((receipt) =>
        receipt.id === updatedReceipt.id ? updatedReceipt : receipt
      )
    );

    setDetails(updatedReceipt);
  };

  const handleFileSelection = (file) => {
    if (!file) return;

    setForm({
      ...form,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    });
  };

  const downloadFile = (fileName, content, type = "text/plain") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const getExportReceipts = () => {
    return receipts.filter((receipt) => {
      const matchesChild =
        exportOptions.child === "Tous les enfants" ||
        receipt.child === exportOptions.child;

      const matchesTaxes = !exportOptions.taxesOnly || receipt.tax;

      const date = receipt.invoiceDate || "";
      const matchesStart = !exportOptions.startDate || date >= exportOptions.startDate;
      const matchesEnd = !exportOptions.endDate || date <= exportOptions.endDate;

      return matchesChild && matchesTaxes && matchesStart && matchesEnd;
    });
  };

  const exportExpenseGridPdf = () => {
    const selectedReceipts = getExportReceipts();

    const lines = selectedReceipts.map((receipt) =>
      [
        receipt.invoiceDate || "Sans date",
        receipt.child,
        receipt.title,
        receipt.category,
        `${receipt.amount} $`,
        `Part autre parent : ${receipt.reimbursementPercent || 0} %`,
        `À rembourser : ${moneyLabel(calculateExpected(receipt))}`,
      ].join(" | ")
    );

    const content = [
      "GRILLE DES DÉPENSES",
      "",
      `Enfant : ${exportOptions.child}`,
      `Période : ${exportOptions.startDate || "début"} à ${
        exportOptions.endDate || "fin"
      }`,
      `Impôts seulement : ${exportOptions.taxesOnly ? "Oui" : "Non"}`,
      "",
      ...(lines.length ? lines : ["Aucune dépense pour ces critères."]),
    ].join("\n");

    downloadFile("grille-depenses.pdf", content, "application/pdf");
  };

  const exportReceiptsZip = () => {
    const selectedReceipts = getExportReceipts();

    const lines = selectedReceipts.map((receipt) =>
      [
        receipt.invoiceDate || "Sans date",
        receipt.title,
        receipt.child,
        receipt.category,
        `${receipt.amount} $`,
        `À rembourser : ${moneyLabel(calculateExpected(receipt))}`,
        exportOptions.includeDocuments
          ? `Document : ${receipt.fileName || "aucun"}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ")
    );

    const content = [
      "EXPORT ZIP DES FACTURES",
      "",
      `Enfant : ${exportOptions.child}`,
      `Période : ${exportOptions.startDate || "début"} à ${
        exportOptions.endDate || "fin"
      }`,
      `Impôts seulement : ${exportOptions.taxesOnly ? "Oui" : "Non"}`,
      `Inclure les documents : ${exportOptions.includeDocuments ? "Oui" : "Non"}`,
      "",
      ...(lines.length ? lines : ["Aucune facture à exporter."]),
    ].join("\n");

    downloadFile("factures-export.zip", content, "application/zip");
  };

  const runReceiptExport = () => {
    if (exportOptions.exportType === "grid") {
      exportExpenseGridPdf();
    }

    if (exportOptions.exportType === "zip") {
      exportReceiptsZip();
    }

    setShowExportPopup(false);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Factures et reçus"
        subtitle="Classer les dépenses, impôts et remboursements."
        icon={ReceiptText}
      />

      <div className="rounded-[2rem] bg-[#F6F0FF] p-5 shadow-sm ring-1 ring-[#F1DDAE]">
        <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#EFE4D6]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D9C9F2] text-white shadow-sm">
            <ReceiptText className="h-6 w-6" />
          </div>

          <h3 className="mt-3 text-xl font-bold text-[#55534C]">
            Ajouter une facture
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#746F64]">
            Ajoute une dépense, indique l’enfant concerné, le remboursement et
            si c’est utile pour les impôts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReceiptPopup(true)}
          className="mt-5 w-full rounded-2xl bg-[#D9C9F2] px-4 py-4 text-sm font-bold text-white shadow-sm"
        >
          Ajouter une facture
        </button>
      </div>

      <div className="grid !grid-cols-3 gap-3">
        <SummaryButton label="À rembourser" value={reimbursementReceipts.length} />
        <SummaryButton label="Impôts" value={taxReceipts.length} />
        <SummaryButton label="Factures" value={receipts.length} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowOtherParentInfo(true)}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#746F64] shadow-sm ring-1 ring-[#EFE4D6]"
        >
          Information sur l’autre parent
        </button>
      </div>

      <ReceiptSection
        title="Factures à rembourser par l’autre parent"
        receipts={reimbursementReceipts}
        onDetails={setDetails}
      />

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#55534C]">
              Dépenses par enfant
            </h3>
            <p className="mt-1 text-sm leading-5 text-[#746F64]">
              Voir les factures à rembourser et les montants associés.
            </p>
          </div>

          <div className="rounded-full bg-[#F6F0FF] px-3 py-1 text-xs font-bold text-[#B68E3D] ring-1 ring-[#F1DDAE]">
            {reimbursementReceipts.length}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {expensesByChild.length ? (
            expensesByChild.map((entry) => {
              const color = getColor(entry.child.color);

              return (
                <div
                  key={entry.child.name}
                  className={`rounded-2xl p-4 ring-1 ${color.soft}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={entry.child.photo}
                        alt={displayName(entry.child)}
                        className="h-11 w-11 rounded-2xl object-cover"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#55534C]">
                          {displayName(entry.child)}
                        </p>

                        <p className="text-xs text-[#746F64]">
                          {entry.receipts.length} facture
                          {entry.receipts.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#55534C]">
                        {moneyLabel(entry.expected)}
                      </p>
                      <p className="text-xs text-[#746F64]">à rembourser</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {entry.receipts.map((receipt) => (
                      <button
                        key={receipt.id}
                        type="button"
                        onClick={() => setDetails(receipt)}
                        className="flex w-full items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-left text-sm ring-1 ring-white"
                      >
                        <span className="font-bold text-[#55534C]">
                          {receipt.title}
                        </span>

                        <span className="text-[#746F64]">
                          {moneyLabel(calculateExpected(receipt))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#746F64] ring-1 ring-[#EFE4D6]">
              Aucune dépense à rembourser par enfant.
            </div>
          )}

          {!!generalReimbursementReceipts.length && (
            <div className="rounded-2xl bg-[#F8F3EA] p-4 ring-1 ring-[#EFE4D6]">
              <p className="font-bold text-[#55534C]">Général</p>
              <p className="mt-1 text-xs text-[#746F64]">
                {generalReimbursementReceipts.length} facture
                {generalReimbursementReceipts.length > 1 ? "s" : ""} non
                associée{generalReimbursementReceipts.length > 1 ? "s" : ""} à
                un enfant précis.
              </p>
            </div>
          )}
        </div>
      </div>

      <ReceiptSection
        title="Factures pour les impôts"
        receipts={taxReceipts}
        onDetails={setDetails}
      />

      <ReceiptSection
        title="Toutes les factures"
        receipts={receipts}
        onDetails={setDetails}
      />

      <button
        type="button"
        onClick={() => setShowExportPopup(true)}
        className="w-full rounded-2xl bg-[#55534C] px-4 py-4 text-sm font-bold text-white shadow-sm"
      >
        Exporter
      </button>

      {details && (
        <ReceiptDetails
          receipt={details}
          close={() => setDetails(null)}
          onUpdate={updateReceipt}
        />
      )}

      {showReceiptPopup && (
  <Popup
    title="Ajouter une facture"
    kicker="Nouvelle facture"
    close={() => setShowReceiptPopup(false)}
  >
    <div className="space-y-5">
      <Field label="Titre">
        <input
          className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
          value={form.title}
          onChange={(event) =>
            setForm({
              ...form,
              title: event.target.value,
            })
          }
          placeholder="Ex. Dentiste, pharmacie, activité..."
          autoFocus
        />
      </Field>

      <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
        <Field label="Montant">
          <input
            className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none placeholder:text-[#B8B0A3] focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
            value={form.amount}
            onChange={(event) =>
              setForm({
                ...form,
                amount: event.target.value,
              })
            }
            placeholder="Ex. 42,30"
            inputMode="decimal"
          />
        </Field>

        <Field label="Date de facture">
          <input
            type="date"
            className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
            value={form.invoiceDate}
            onChange={(event) =>
              setForm({
                ...form,
                invoiceDate: event.target.value,
              })
            }
          />
        </Field>
      </div>

      <div className="grid !grid-cols-1 gap-4 sm:!grid-cols-2">
        <Field label="Enfant">
          <select
            className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
            value={form.child}
            onChange={(event) =>
              setForm({
                ...form,
                child: event.target.value,
              })
            }
          >
            <option>Général</option>
            {children.map((child) => (
              <option key={child.name} value={child.name}>
                {displayName(child)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Catégorie">
          <select
            className="mt-2 w-full rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#55534C] outline-none focus:border-[#9D86C8] focus:ring-2 focus:ring-[#D9C9F2]"
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category: event.target.value,
              })
            }
          >
            {[
              "Santé",
              "École",
              "Garderie",
              "Activités",
              "Vêtements",
              "Transport",
              "Autre",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="rounded-2xl bg-[#F8F3EA] p-4 ring-1 ring-[#EFE4D6]">
        <p className="label">Preuve de facture</p>

        <div className="mt-3 grid !grid-cols-2 gap-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white px-3 py-4 text-center text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
            <FileText className="h-5 w-5" />
            Choisir un document
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.txt,.xls,.xlsx"
              onChange={(event) =>
                handleFileSelection(event.target.files?.[0])
              }
            />
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white px-3 py-4 text-center text-xs font-bold text-[#746F64] ring-1 ring-[#EFE4D6]">
            <Camera className="h-5 w-5" />
            Prendre une photo
            <input
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={(event) =>
                handleFileSelection(event.target.files?.[0])
              }
            />
          </label>
        </div>
      </div>

      <div className="grid !grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowReceiptPopup(false)}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={addReceipt}
          className="rounded-2xl bg-[#9D86C8] px-4 py-3 text-sm font-bold text-white"
        >
          Ajouter
        </button>
      </div>
    </div>
  </Popup>
)}

      {showExportPopup && (
        <Popup
          title="Exporter"
          kicker="Factures"
          close={() => setShowExportPopup(false)}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-[#55534C]">
                Que veux-tu exporter?
              </p>

              <div className="mt-3 grid !grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      exportType: "grid",
                    })
                  }
                  className={`rounded-2xl px-4 py-4 text-sm font-bold ring-1 ${
                    exportOptions.exportType === "grid"
                      ? "bg-[#F6F0FF] text-[#B68E3D] ring-2 ring-[#F1DDAE]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  Grille des dépenses
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      exportType: "zip",
                    })
                  }
                  className={`rounded-2xl px-4 py-4 text-sm font-bold ring-1 ${
                    exportOptions.exportType === "zip"
                      ? "bg-[#F6F0FF] text-[#B68E3D] ring-2 ring-[#F1DDAE]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  ZIP des factures
                </button>
              </div>
            </div>

            <Field label="Enfant">
              <select
                className="input"
                value={exportOptions.child}
                onChange={(event) =>
                  setExportOptions({
                    ...exportOptions,
                    child: event.target.value,
                  })
                }
              >
                <option>Tous les enfants</option>
                <option>Général</option>
                {children.map((child) => (
                  <option key={child.name} value={child.name}>
                    {displayName(child)}
                  </option>
                ))}
              </select>
            </Field>

            {exportOptions.exportType === "zip" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      taxesOnly: !exportOptions.taxesOnly,
                    })
                  }
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left ring-1 ${
                    exportOptions.taxesOnly
                      ? "bg-[#F6F0FF] text-[#B68E3D] ring-[#F1DDAE]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold">
                      Factures pour l’impôt seulement
                    </p>
                    <p className="mt-1 text-xs opacity-75">
                      Exporter uniquement les factures marquées pour les impôts.
                    </p>
                  </div>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      exportOptions.taxesOnly
                        ? "bg-[#D9C9F2] text-white"
                        : "bg-[#F8F3EA] text-[#A8B193]"
                    }`}
                  >
                    {exportOptions.taxesOnly ? "✓" : ""}
                  </span>
                </button>

                <div className="rounded-2xl bg-[#F8F3EA] p-4 ring-1 ring-[#EFE4D6]">
                  <p className="label">Période des dates de facture</p>

                  <div className="mt-3 grid !grid-cols-2 gap-3">
                    <Field label="Du">
                      <input
                        type="date"
                        className="input bg-white"
                        value={exportOptions.startDate}
                        onChange={(event) =>
                          setExportOptions({
                            ...exportOptions,
                            startDate: event.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Au">
                      <input
                        type="date"
                        className="input bg-white"
                        value={exportOptions.endDate}
                        onChange={(event) =>
                          setExportOptions({
                            ...exportOptions,
                            endDate: event.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setExportOptions({
                      ...exportOptions,
                      includeDocuments: !exportOptions.includeDocuments,
                    })
                  }
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left ring-1 ${
                    exportOptions.includeDocuments
                      ? "bg-[#F6F0FF] text-[#B68E3D] ring-[#F1DDAE]"
                      : "bg-white text-[#746F64] ring-[#EFE4D6]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold">Inclure les documents</p>
                    <p className="mt-1 text-xs opacity-75">
                      Ajouter les preuves ou photos de factures au ZIP.
                    </p>
                  </div>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      exportOptions.includeDocuments
                        ? "bg-[#D9C9F2] text-white"
                        : "bg-[#F8F3EA] text-[#A8B193]"
                    }`}
                  >
                    {exportOptions.includeDocuments ? "✓" : ""}
                  </span>
                </button>
              </>
            )}

            {exportOptions.exportType === "grid" && (
              <div className="rounded-2xl bg-[#F6F0FF] p-4 text-sm leading-6 text-[#B68E3D] ring-1 ring-[#F1DDAE]">
                La grille des dépenses génère un fichier PDF simple avec les
                dépenses sélectionnées.
              </div>
            )}

            <div className="grid !grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExportPopup(false)}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#746F64] ring-1 ring-[#EFE4D6]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={runReceiptExport}
                className="rounded-2xl bg-[#55534C] px-4 py-3 text-sm font-bold text-white"
              >
                Exporter
              </button>
            </div>
          </div>
        </Popup>
      )}

      {showOtherParentInfo && (
        <Popup
          title="Information sur l’autre parent"
          kicker="Remboursements"
          close={() => setShowOtherParentInfo(false)}
        >
          <div className="space-y-4">
            <Field label="Nom">
              <input
                className="input"
                value={otherParent.name}
                onChange={(event) =>
                  setOtherParent({
                    ...otherParent,
                    name: event.target.value,
                  })
                }
                placeholder="Ex. Nom du parent"
              />
            </Field>

            <Field label="% entre les parties">
              <div className="flex items-center rounded-2xl border border-[#EFE4D6] bg-[#FFFDF8] px-4 py-3">
                <input
                  className="w-full bg-transparent text-sm font-bold text-[#55534C] outline-none"
                  value={otherParent.sharePercent}
                  onChange={(event) =>
                    setOtherParent({
                      ...otherParent,
                      sharePercent: event.target.value,
                    })
                  }
                  placeholder="50"
                  inputMode="decimal"
                />

                <span className="ml-2 text-xs font-bold text-[#A8B193]">
                  %
                </span>
              </div>
            </Field>

            <button
              type="button"
              onClick={() => {
                setShowOtherParentInfo(false);
                setShowStatement(true);
              }}
              className="w-full rounded-2xl bg-[#F6F0FF] px-4 py-3 text-sm font-bold text-[#B68E3D] ring-1 ring-[#F1DDAE]"
            >
              Voir l’état de compte
            </button>
          </div>
        </Popup>
      )}

      {showStatement && (
        <Popup
          title="État de compte"
          kicker="Remboursements"
          close={() => setShowStatement(false)}
        >
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <p className="label">Parent concerné</p>
              <p className="mt-1 font-bold text-[#55534C]">
                {otherParent.name || "À préciser"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <p className="label">% de partage entre les parties</p>
              <p className="mt-1 font-bold text-[#55534C]">
                {otherParent.sharePercent || 0} %
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <p className="label">Total à rembourser</p>
              <p className="mt-1 font-bold text-[#55534C]">
                {moneyLabel(statementTotal)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <p className="label">Paiements reçus</p>
              <p className="mt-1 font-bold text-[#55534C]">
                {moneyLabel(statementPaid)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
              <p className="label">Solde restant</p>
              <p className="mt-1 font-bold text-[#55534C]">
                {moneyLabel(statementRemaining)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowStatement(false)}
              className="w-full rounded-2xl bg-[#D9C9F2] px-4 py-3 text-sm font-bold text-white"
            >
              Fermer
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
}