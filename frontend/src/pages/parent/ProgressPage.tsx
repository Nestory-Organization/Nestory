import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import AssignmentProgressBoard from '../../components/progress/AssignmentProgressBoard';
import AssignmentService from '../../services/assignmentService';
import FamilyService from '../../services/familyService';
import ReadingService from '../../services/readingService';
import ReadingWeeklyBarChart from '../../components/progress/ReadingWeeklyBarChart';
import { AssignmentProgressOverview, Family, ReadingActivitySummary } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, BarChart3 } from 'lucide-react';

const ParentProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [family, setFamily] = useState<Family | null>(null);
  const [data, setData] = useState<AssignmentProgressOverview | null>(null);
  const [weekActivity, setWeekActivity] = useState<ReadingActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterChildId, setFilterChildId] = useState(() => searchParams.get('childId') ?? '');

  useEffect(() => {
    const cid = searchParams.get('childId') ?? '';
    setFilterChildId((prev) => (prev === cid ? prev : cid));
  }, [searchParams]);

  useEffect(() => {
    FamilyService.getMyFamily()
      .then(setFamily)
      .catch(() => {
        /* optional — filter still works from assignment rows */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [overview, activity] = await Promise.all([
          AssignmentService.getParentProgressOverview(filterChildId || undefined),
          ReadingService.getFamilyActivitySummary(7).catch(() => null),
        ]);
        if (!cancelled) {
          setData(overview);
          setWeekActivity(activity);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message =
            typeof e === 'object' &&
            e !== null &&
            'response' in e &&
            typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message ===
              'string'
              ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
              : 'Failed to load progress';
          toast.error(message || 'Failed to load progress');
          setData(null);
          setWeekActivity(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [filterChildId]);

  const childOptions = useMemo(() => {
    const list = family?.children || [];
    return list
      .map((c) => ({ id: String(c.id || c._id || ''), name: c.name }))
      .filter((c) => c.id);
  }, [family]);

  const handleFilterChildId = (id: string) => {
    setFilterChildId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set('childId', id);
        else next.delete('childId');
        return next;
      },
      { replace: true }
    );
  };

  const printTitle =
    filterChildId && childOptions.length > 0
      ? `Reading progress — ${childOptions.find((c) => c.id === filterChildId)?.name || 'filtered'}`
      : 'Reading progress — family';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print">
        <Navbar title="Reading progress" />
      </div>

      <div className="container-responsive py-8 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="no-print btn-secondary mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <div className="flex items-start gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-nestory-100 flex items-center justify-center shrink-0">
            <BarChart3 className="text-nestory-600" size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reading progress</h1>
            <p className="text-gray-600 mt-1">
              See each child’s assignment progress, how finished dates compare to due dates, and what pace
              is needed to hit deadlines.
            </p>
          </div>
        </div>

        {weekActivity && (
          <div className="card mb-8 border-nestory-200 bg-gradient-to-br from-white to-nestory-50/50">
            <h2 className="text-lg font-bold text-gray-900">This week (family)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pages and minutes from progress saves (last {weekActivity.days} days), all children
              combined.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/90 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Pages</p>
                <p className="text-2xl font-bold text-gray-900">{weekActivity.totalPagesLogged}</p>
              </div>
              <div className="rounded-lg bg-white/90 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Minutes</p>
                <p className="text-2xl font-bold text-gray-900">{weekActivity.totalMinutesLogged}</p>
              </div>
              <div className="rounded-lg bg-white/90 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Saves</p>
                <p className="text-2xl font-bold text-gray-900">{weekActivity.progressSaveCount}</p>
              </div>
              <div className="rounded-lg bg-white/90 border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-500">Period</p>
                <p className="text-sm font-semibold text-gray-800 mt-2">
                  {new Date(weekActivity.periodStart).toLocaleDateString()} –{' '}
                  {new Date(weekActivity.periodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
            {weekActivity.byDay && weekActivity.byDay.length > 0 ? (
              <div className="mt-6 rounded-xl bg-white/90 border border-gray-100 p-4">
                <ReadingWeeklyBarChart
                  byDay={weekActivity.byDay}
                  title={`Family minutes & pages per day (last ${weekActivity.days} days)`}
                />
              </div>
            ) : null}
          </div>
        )}

        <AssignmentProgressBoard
          data={data}
          loading={loading}
          showChildColumn
          filterChildId={filterChildId}
          onFilterChildId={handleFilterChildId}
          childOptions={childOptions}
          enableExportPrint
          documentTitle={printTitle}
          enableAssignmentSearch
        />
      </div>
    </div>
  );
};

export default ParentProgressPage;
