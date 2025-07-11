"""Add vacancy_rate to Valuation

Revision ID: d8e25df2175b
Revises: 
Create Date: 2025-06-30 11:19:38.596304

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e25df2175b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('valuation', sa.Column('vacancy_rate', sa.Float(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('valuation', 'vacancy_rate')
    # ### end Alembic commands ###
