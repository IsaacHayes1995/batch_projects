"""Regressions for ERPNext core fields and the optional HRMS boundary."""

import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from batch_projects import timesheet_sync
from batch_projects.setup import integration_fields


class TestOptionalIntegrationFields(unittest.TestCase):
    @staticmethod
    def _frappe_with_db(**db_methods):
        return SimpleNamespace(db=SimpleNamespace(**db_methods))

    def test_available_fields_excludes_missing_hrms_doctypes(self):
        fake_frappe = self._frappe_with_db(
            exists=lambda doctype, name: name == "Timesheet Detail",
        )
        with patch.object(integration_fields, "frappe", fake_frappe):
            fields = integration_fields._available_fields(
                {
                    "Timesheet Detail": [{"fieldname": "custom_bp_task"}],
                    "Expense Claim Type": [{"fieldname": "custom_reinvoice_policy"}],
                }
            )

        self.assertEqual(list(fields), ["Timesheet Detail"])

    def test_ensure_fields_does_not_pass_missing_hrms_doctypes(self):
        fake_frappe = self._frappe_with_db(
            exists=lambda doctype, name: name in integration_fields.CORE_CUSTOM_FIELDS,
        )
        with (
            patch.object(integration_fields, "frappe", fake_frappe),
            patch(
                "frappe.custom.doctype.custom_field.custom_field.create_custom_fields"
            ) as create_custom_fields,
        ):
            integration_fields.ensure_integration_custom_fields()

        created = create_custom_fields.call_args.args[0]
        self.assertEqual(set(created), set(integration_fields.CORE_CUSTOM_FIELDS))
        self.assertTrue(set(created).isdisjoint(integration_fields.HRMS_CUSTOM_FIELDS))
        self.assertTrue(create_custom_fields.call_args.kwargs["update"])

    def test_ensure_fields_includes_hrms_when_installed(self):
        fake_frappe = self._frappe_with_db(exists=lambda doctype, name: True)
        with (
            patch.object(integration_fields, "frappe", fake_frappe),
            patch(
                "frappe.custom.doctype.custom_field.custom_field.create_custom_fields"
            ) as create_custom_fields,
        ):
            integration_fields.ensure_integration_custom_fields()

        created = create_custom_fields.call_args.args[0]
        self.assertEqual(
            set(created),
            set(integration_fields.CORE_CUSTOM_FIELDS)
            | set(integration_fields.HRMS_CUSTOM_FIELDS),
        )

    def test_task_read_degrades_safely_before_field_repair(self):
        sql = Mock()
        fake_frappe = self._frappe_with_db(sql=sql)
        with (
            patch.object(timesheet_sync, "frappe", fake_frappe),
            patch.object(timesheet_sync, "has_timesheet_task_field", return_value=False),
        ):
            self.assertFalse(timesheet_sync.task_has_timesheet_rows("TASK-1"))

        sql.assert_not_called()

    def test_reconcile_degrades_safely_before_field_repair(self):
        sql = Mock()
        fake_frappe = self._frappe_with_db(sql=sql)
        with (
            patch.object(timesheet_sync, "frappe", fake_frappe),
            patch.object(timesheet_sync, "has_timesheet_task_field", return_value=False),
        ):
            self.assertEqual(timesheet_sync.reconcile_actual_hours(), 0)

        sql.assert_not_called()


if __name__ == "__main__":
    unittest.main()
