"""add_terminal_sale_to_valuation

Revision ID: 698f945c948c
Revises: 8e4fe8c781a1
Create Date: 2025-07-01 16:19:32.293004

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '698f945c948c'
down_revision: Union[str, Sequence[str], None] = '8e4fe8c781a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('valuation', sa.Column('exit_cap_rate', sa.Float(), nullable=True))
    op.add_column('valuation', sa.Column('selling_costs', sa.Float(), nullable=True))
    op.add_column('property', sa.Column('postcode', sa.String(), nullable=False, server_default=''))
    op.alter_column('property', 'postcode', server_default=None)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('valuation', 'selling_costs')
    op.drop_column('valuation', 'exit_cap_rate')
    op.drop_column('property', 'postcode')
    # ### end Alembic commands ###
