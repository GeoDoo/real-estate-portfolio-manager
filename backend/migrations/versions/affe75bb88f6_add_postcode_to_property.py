"""add_postcode_to_property

Revision ID: affe75bb88f6
Revises: 698f945c948c
Create Date: 2025-07-02 16:47:16.560795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'affe75bb88f6'
down_revision: Union[str, Sequence[str], None] = '698f945c948c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # No-op: postcode column already exists in the property table
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # No-op: manual intervention needed to drop postcode column if required
    pass
