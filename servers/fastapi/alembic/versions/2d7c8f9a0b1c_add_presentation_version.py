"""add presentation version

Revision ID: 2d7c8f9a0b1c
Revises: 9f1a2b3c4d5e
Create Date: 2026-06-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2d7c8f9a0b1c"
down_revision: Union[str, None] = "9f1a2b3c4d5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PRESENTATION_VERSION_DEFAULT = "v1-standard"


def _has_table(table_name: str) -> bool:
    return table_name in sa.inspect(op.get_bind()).get_table_names()


def _has_column(table_name: str, column_name: str) -> bool:
    columns = sa.inspect(op.get_bind()).get_columns(table_name)
    return column_name in {column["name"] for column in columns}


def _presentation_version_enum() -> sa.Enum:
    return sa.Enum(
        "v1-standard",
        "v2-standard",
        name="presentation_version",
        native_enum=False,
        create_constraint=True,
    )


def upgrade() -> None:
    if not _has_table("presentations"):
        return

    version_type = _presentation_version_enum()
    if not _has_column("presentations", "version"):
        op.add_column(
            "presentations",
            sa.Column(
                "version",
                version_type,
                nullable=True,
            ),
        )

    op.execute(
        "UPDATE presentations "
        f"SET version = '{PRESENTATION_VERSION_DEFAULT}' "
        "WHERE version IS NULL"
    )

    with op.batch_alter_table("presentations") as batch_op:
        batch_op.alter_column(
            "version",
            existing_type=version_type,
            nullable=False,
        )


def downgrade() -> None:
    if _has_table("presentations") and _has_column("presentations", "version"):
        op.drop_column("presentations", "version")
