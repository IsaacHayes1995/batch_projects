"""Custom fields that connect BatchProjects to ERPNext and optional HRMS.

These fields used to live in one Frappe fixture file. Fixture imports are
all-or-nothing, so a site without HRMS failed on ``Expense Claim Type`` before
Frappe reached the core ``Timesheet Detail-custom_bp_task`` field. The missing
timesheet field then broke every task read.

Create the fields idempotently instead. Core ERPNext fields are always
installed; HRMS fields are added only when their target DocTypes exist. Since
this runs after every migrate, installing HRMS later enables the integration
without reinstalling BatchProjects.
"""

import frappe


CORE_CUSTOM_FIELDS = {
    "Timesheet Detail": [
        {
            "fieldname": "custom_bp_task",
            "label": "BP Task",
            "fieldtype": "Link",
            "options": "BP Task",
            "insert_after": "task",
            "description": (
                "The BatchProjects task this time entry logs against. This "
                "lets BP Task actual hours roll up from submitted Timesheets."
            ),
        },
    ],
    "Sales Order": [
        {
            "fieldname": "custom_bp_project",
            "label": "Batch Project",
            "fieldtype": "Link",
            "options": "BP Project",
            "insert_after": "project",
            "description": "The BatchProjects project created from this Sales Order.",
            "read_only": 1,
            "no_copy": 1,
            "print_hide": 1,
        },
    ],
    "Lead": [
        {
            "fieldname": "custom_bp_project",
            "label": "Batch Project",
            "fieldtype": "Link",
            "options": "BP Project",
            "insert_after": "status",
            "description": "The BatchProjects project created from this Lead.",
            "read_only": 1,
            "no_copy": 1,
            "print_hide": 1,
        },
    ],
    "Opportunity": [
        {
            "fieldname": "custom_bp_project",
            "label": "Batch Project",
            "fieldtype": "Link",
            "options": "BP Project",
            "insert_after": "status",
            "description": "The BatchProjects project created from this Opportunity.",
            "read_only": 1,
            "no_copy": 1,
            "print_hide": 1,
        },
    ],
    "Quotation": [
        {
            "fieldname": "custom_bp_project",
            "label": "Batch Project",
            "fieldtype": "Link",
            "options": "BP Project",
            "insert_after": "status",
            "description": "The BatchProjects project created from this Quotation.",
            "read_only": 1,
            "no_copy": 1,
            "print_hide": 1,
        },
    ],
}


HRMS_CUSTOM_FIELDS = {
    "Expense Claim Type": [
        {
            "fieldname": "custom_reinvoice_policy",
            "label": "Client Re-invoicing",
            "fieldtype": "Select",
            "options": "At Cost\nAt Cost + Markup\nNot Billable",
            "insert_after": "description",
            "default": "At Cost",
            "description": (
                "Controls whether client expenses are re-invoiced at cost, "
                "with a markup, or not at all."
            ),
        },
        {
            "fieldname": "custom_markup_percent",
            "label": "Markup %",
            "fieldtype": "Percent",
            "insert_after": "custom_reinvoice_policy",
            "default": "0",
            "depends_on": "eval:doc.custom_reinvoice_policy == 'At Cost + Markup'",
            "description": "Markup applied when re-invoicing this expense type.",
            "non_negative": 1,
        },
    ],
    "Expense Claim Detail": [
        {
            "fieldname": "custom_is_billable",
            "label": "Billable",
            "fieldtype": "Check",
            "insert_after": "sanctioned_amount",
            "default": "0",
            "description": "Whether this expense line should be re-invoiced to the client.",
            "in_list_view": 1,
        },
        {
            "fieldname": "custom_sales_invoice",
            "label": "Re-invoiced On",
            "fieldtype": "Link",
            "options": "Sales Invoice",
            "insert_after": "custom_is_billable",
            "description": "The Sales Invoice that re-invoiced this expense line.",
            "read_only": 1,
            "no_copy": 1,
            "print_hide": 1,
        },
    ],
}


def _available_fields(field_groups):
    """Return only field groups whose target DocType is installed."""
    return {
        doctype: [
            {**field, "module": "Batch Projects"}
            for field in fields
        ]
        for doctype, fields in field_groups.items()
        if frappe.db.exists("DocType", doctype)
    }


def ensure_integration_custom_fields():
    """Create/update core fields and any available optional-HRMS fields."""
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    fields = _available_fields(CORE_CUSTOM_FIELDS)
    fields.update(_available_fields(HRMS_CUSTOM_FIELDS))
    if fields:
        create_custom_fields(fields, update=True)


def has_timesheet_task_field():
    """Whether Timesheet Detail is ready for the BatchProjects task link."""
    return bool(
        frappe.db.table_exists("Timesheet Detail")
        and frappe.db.has_column("Timesheet Detail", "custom_bp_task")
    )


def has_hrms_expense_integration():
    """Whether the optional HRMS expense feature is installed and migrated."""
    required_columns = {
        "Expense Claim Detail": ("custom_is_billable", "custom_sales_invoice"),
        "Expense Claim Type": ("custom_reinvoice_policy", "custom_markup_percent"),
    }
    return all(
        frappe.db.table_exists(doctype)
        and all(frappe.db.has_column(doctype, fieldname) for fieldname in fieldnames)
        for doctype, fieldnames in required_columns.items()
    )
