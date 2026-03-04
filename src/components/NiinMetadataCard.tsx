import { AlertTriangle } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import StatusPill from './StatusPill';
import type { NiinRecord } from '@/types';

interface NiinMetadataCardProps {
  niin: NiinRecord;
  loading?: boolean;
}

export default function NiinMetadataCard({ niin, loading }: NiinMetadataCardProps) {
  return (
    <SectionWrapper title="NIIN Details" loading={loading}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        <Field label="NIIN" value={<span className="font-mono font-medium">{niin.niin}</span>} />
        <Field label="Nomenclature" value={niin.nomenclature} />
        <Field label="Platform(s)" value={niin.platforms.join(', ')} />
        <Field
          label="Criticality"
          value={
            niin.criticalityFlag ? (
              <StatusPill label="MICAP" variant="red" />
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Standard</span>
            )
          }
        />
        <Field
          label="Single Source"
          value={
            niin.singleSource ? (
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Yes
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">No</span>
            )
          }
        />
        <Field label="Lead Time" value={`${niin.leadTimeDays} days`} />
        <Field
          label="Unit Cost"
          value={`$${niin.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>
    </SectionWrapper>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{value ?? <span className="text-gray-400 dark:text-gray-500" title="Data unavailable">Unknown</span>}</dd>
    </div>
  );
}
