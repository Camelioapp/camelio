import React, { useMemo, useState } from "react";
import {
  Calculator,
  CalendarDays,
  ChevronRight,
  Download,
  Percent,
} from "lucide-react";

import { SectionTitle } from "./shared.jsx";
import { displayName, getColor } from "./sectionsData.js";

function getCurrentYear() {
  return new Date().getFullYear();
}

function isCustodyEntry(entry) {
  return entry?.entryType === "custody" || entry?.entryType === "both";
}

function parseEntryKey(key) {
  const parts = String(key).split("-").map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    date: new Date(year, month, day),
  };
}

function formatPercent(value) {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

function buildYearStats({ calendarEntries, children, year }) {
  const yearDays =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;

  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const baseStats = children.map((child) => ({
    ...child,
    custodyDays: 0,
    percent: 0,
    months: months.map((monthName) => ({
      monthName,
      days: 0,
    })),
  }));

  Object.entries(calendarEntries || {}).forEach(([key, entry]) => {
    const parsed = parseEntryKey(key);

    if (!parsed || parsed.year !== year || !isCustodyEntry(entry)) {
      return;
    }

    const entryChildIds = Array.isArray(entry.childIds)
      ? entry.childIds
      : [];

    const legacyEntryChildren = Array.isArray(entry.children)
      ? entry.children
      : [];

    const linkedChildren =
      entryChildIds.length > 0 ? entryChildIds : legacyEntryChildren;

    linkedChildren.forEach((childReference) => {
      const childStat = baseStats.find((child) => {
        return (
          child.id === childReference ||
          child.name === childReference ||
          child.firstName === childReference ||
          child.nickname === childReference
        );
      });

      if (!childStat) {
        return;
      }

      childStat.custodyDays += 1;

      if (childStat.months[parsed.month]) {
        childStat.months[parsed.month].days += 1;
      }
    });
  });

  return baseStats.map((child) => ({
    ...child,
    percent: Math.round((child.custodyDays / yearDays) * 1000) / 10,
  }));
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-center shadow-sm ring-1 ring-[#EFE4D6]">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F3EA] text-[#7A8564] ring-1 ring-[#DDE4D2]">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-3 text-xl font-extrabold text-[#55534C]">{value}</p>

      <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-wide text-[#746F64]">
        {label}
      </p>
    </div>
  );
}

function ChildResultCard({ child, yearDays }) {
  const color = getColor(child.color);
  const remainingDays = Math.max(0, yearDays - child.custodyDays);

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
      <div className="flex items-center gap-3">
        <img
          src={child.photo}
          alt={displayName(child)}
          className="h-16 w-16 rounded-3xl object-cover shadow-sm ring-4 ring-white"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-[#55534C]">
            {displayName(child)}
          </p>

          <p className="mt-1 text-sm text-[#746F64]">
            {child.custodyDays} jour{child.custodyDays > 1 ? "s" : ""} de garde
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${color.soft}`}
        >
          {formatPercent(child.percent)}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-bold text-[#746F64]">
          <span>Répartition annuelle</span>
          <span>{formatPercent(child.percent)}</span>
        </div>

        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#F8F3EA]">
          <div
            className={`h-full rounded-full ${color.dot}`}
            style={{ width: `${Math.min(100, child.percent)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid !grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
          <p className="label">Jours avec vous</p>
          <p className="mt-1 font-bold text-[#55534C]">
            {child.custodyDays}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFFDF8] p-4 ring-1 ring-[#EFE4D6]">
          <p className="label">Autres jours</p>
          <p className="mt-1 font-bold text-[#55534C]">{remainingDays}</p>
        </div>
      </div>
    </div>
  );
}

function MonthBreakdown({ child }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <img
            src={child.photo}
            alt={displayName(child)}
            className="h-11 w-11 rounded-2xl object-cover"
          />

          <div>
            <p className="font-bold text-[#55534C]">
              Détail mensuel, {displayName(child)}
            </p>

            <p className="text-sm text-[#746F64]">
              Voir le nombre de jours par mois.
            </p>
          </div>
        </div>

        <ChevronRight
          className={`h-5 w-5 shrink-0 text-[#A8B193] transition ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-5 grid !grid-cols-2 gap-3">
          {child.months.map((month) => (
            <div
              key={`${child.name}-${month.monthName}`}
              className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#EFE4D6]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#8A8175]">
                {month.monthName}
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#55534C]">
                {month.days}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustodyCalculator({
  children = [],
  calendarEntries = {},
}) {
  const currentYear = getCurrentYear();
  const [year, setYear] = useState(currentYear);

  const yearDays =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;

  const stats = useMemo(() => {
    return buildYearStats({
      calendarEntries,
      children,
      year,
    });
  }, [calendarEntries, children, year]);

  const totalCustodyDays = stats.reduce(
    (sum, child) => sum + child.custodyDays,
    0
  );

  const averagePercent =
    stats.length > 0
      ? Math.round(
          (stats.reduce((sum, child) => sum + child.percent, 0) /
            stats.length) *
            10
        ) / 10
      : 0;

  const years = Array.from({ length: 6 }, (_, index) => currentYear + index);

  const exportSummary = () => {
    const lines = [
      `Calculateur de journées, ${year}`,
      "",
      `Nombre de jours dans l'année : ${yearDays}`,
      `Total des journées inscrites : ${totalCustodyDays}`,
      `Moyenne estimée : ${formatPercent(averagePercent)}`,
      "",
      ...stats.flatMap((child) => [
        `${displayName(child)}`,
        `Jours de garde : ${child.custodyDays}`,
        `Pourcentage : ${formatPercent(child.percent)}`,
        "",
      ]),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `calculateur-journees-${year}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Calculateur de journées"
        subtitle="Estimation selon les journées de garde inscrites au calendrier."
        icon={Calculator}
      />

      <div className="rounded-[2rem] bg-[#F4F8FD] p-5 shadow-sm ring-1 ring-[#D3DFF1]">
        <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#EFE4D6]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A2BADF] text-white shadow-sm">
            <Calculator className="h-6 w-6" />
          </div>

          <h3 className="mt-3 text-xl font-bold text-[#55534C]">
            Résumé de garde
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#746F64]">
            Les résultats se basent sur les journées marquées comme journée de
            garde dans le calendrier familial.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#EFE4D6]">
        <div className="grid !grid-cols-2 gap-3">
          <div>
            <p className="label">Année</p>

            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="input"
            >
              {years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={exportSummary}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#A2BADF] px-4 py-3 text-sm font-bold text-white"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      <div className="grid !grid-cols-3 gap-3">
        <SummaryCard
          label="Année"
          value={yearDays}
          icon={CalendarDays}
        />

        <SummaryCard
          label="Jours inscrits"
          value={totalCustodyDays}
          icon={Calculator}
        />

        <SummaryCard
          label="Moyenne"
          value={formatPercent(averagePercent)}
          icon={Percent}
        />
      </div>

      {children.length === 0 && (
        <div className="rounded-[2rem] bg-white p-5 text-sm leading-6 text-[#746F64] shadow-sm ring-1 ring-[#EFE4D6]">
          Aucun enfant ajouté. Ajoute d’abord un enfant dans la section Profil
          enfant.
        </div>
      )}

      {children.length > 0 && totalCustodyDays === 0 && (
        <div className="rounded-[2rem] bg-[#FFFDF8] p-5 text-sm leading-6 text-[#746F64] shadow-sm ring-1 ring-[#EFE4D6]">
          Aucune journée de garde n’est inscrite pour cette année. Va dans le
          calendrier, sélectionne une journée, puis coche Journée de garde et
          l’enfant concerné.
        </div>
      )}

      <div className="space-y-4">
        {stats.map((child) => (
          <ChildResultCard key={child.id || child.name} child={child} yearDays={yearDays} />
        ))}
      </div>

      <div className="space-y-4">
        {stats.map((child) => (
          <MonthBreakdown key={`${child.id || child.name}-months`} child={child} />
        ))}
      </div>
    </div>
  );
}